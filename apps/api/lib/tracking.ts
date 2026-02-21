import { Server as SocketIOServer, Socket } from 'socket.io';
import pc from 'picocolors';
import { Logging } from '@/lib/logging';
import { createDeliveryLocation, resolveDeliveryId } from '@/services/delivery';
import { DeliveryLocation, UserRole } from 'lib/interfaces';

/* TRACKING */

export interface TrackingInfo {
  deliveryId: string;
  role: UserRole;
  socketId: string;
  dbDeliveryId?: string | null;
  warnedMissingDelivery?: boolean;
  lastLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    timestamp: string;
  };
};

export function initializeTracking(io: SocketIOServer) {
  // Store user tracking info: socketId -> { deliveryId, role, socketId, lastLocation }
  const userTrackingMap = new Map<string, TrackingInfo>();
  const lastDbSaveMap = new Map<string, number>();
  const DB_SAVE_INTERVAL_MS = 16000;
  const buildLocationPayload = (trackingInfo: TrackingInfo) => {
    if (!trackingInfo.lastLocation) return null;

    return {
      deliveryId: trackingInfo.deliveryId,
      latitude: trackingInfo.lastLocation.latitude.toString(),
      longitude: trackingInfo.lastLocation.longitude.toString(),
      accuracyMeters: trackingInfo.lastLocation.accuracy != null ? trackingInfo.lastLocation.accuracy.toString() : null,
      headingDegrees: trackingInfo.lastLocation.heading != null ? trackingInfo.lastLocation.heading.toString() : null,
      speedMetersPerSecond: trackingInfo.lastLocation.speed != null ? trackingInfo.lastLocation.speed.toString() : null,
      capturedAt: trackingInfo.lastLocation.timestamp,
      socketId: trackingInfo.socketId,
      role: trackingInfo.role,
      lastLocation: trackingInfo.lastLocation,
    };
  };

  io.on('connection', (socket: Socket) => {
    console.log(Logging(`[Socket] User ${socket.id} connected`, 'success', 'green'));
    console.log(Logging(`[Socket] Transport: ${socket.conn.transport.name}`, 'info', 'blue'));
    console.log(Logging(`[Socket] Remote address: ${socket.handshake.address}`, 'info', 'blue'));

    socket.on('message', (msg: any) => {
      socket.emit('message', `${socket.id}: ${msg}`);
      console.log(Logging(`[Message] ${msg}`, 'info', 'cyan'));
    });

    // Join tracking room for a delivery
    socket.on(
      'tracking:join',
      (data: { deliveryId: string; userId: string; role: UserRole }) => {
        console.log(Logging(`[Tracking] Received join request: ${JSON.stringify(data)}`, 'info', 'magenta'));
        const { deliveryId, userId, role } = data;
        const roomName = `delivery:${deliveryId}`;

        socket.join(roomName);
        userTrackingMap.set(socket.id, { deliveryId, role, socketId: socket.id });

        console.log(Logging(`[Tracking] User ${userId} (${role}) joined room: ${roomName}`, 'success', 'green'));
        console.log(Logging(`[Tracking] Current room size: ${io.sockets.adapter.rooms.get(roomName)?.size || 0}`, 'info', 'blue'));

        // Notify other users in the room
        socket.to(roomName).emit('tracking:user-joined', {
          userId,
          role,
          socketId: socket.id,
          joinedAt: new Date().toISOString(),
        });
      }
    );

    // Handle location updates in the room
    socket.on(
      'location:update',
      async (data: DeliveryLocation) => {
        console.log(Logging(`[Location] Received update from ${socket.id}`, 'info', 'magenta'));
        console.log(Logging(`[Location] Data: deliveryId=${data.deliveryId}, lat=${data.latitude}, lon=${data.longitude}`, 'info', 'cyan'));
        
        const {
          deliveryId,
          latitude,
          longitude,
          accuracyMeters,
          headingDegrees,
          speedMetersPerSecond,
          capturedAt
        } = data;
        const roomName = `delivery:${deliveryId}`;

        // Convert capturedAt to Date if string
        const capturedDate = typeof capturedAt === 'string' ? new Date(capturedAt) : capturedAt;

        // Update tracking map
        const trackingInfo = userTrackingMap.get(socket.id);
        if (!trackingInfo) {
          console.log(Logging(`[Location] Ignored update - user not in tracking room`, 'warning', 'yellow'));
          return;
        }
        if (trackingInfo) {
          trackingInfo.lastLocation = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            accuracy: accuracyMeters ? parseFloat(accuracyMeters) : null,
            heading: headingDegrees ? parseFloat(headingDegrees) : null,
            speed: speedMetersPerSecond ? parseFloat(speedMetersPerSecond) : null,
            timestamp: capturedDate.toISOString(),
          };
        }

        console.log(Logging(`[Location] Room: ${roomName}, Tracking info exists: ${!!trackingInfo}`, 'info', 'blue'));

        if (trackingInfo.role === UserRole.delivery && trackingInfo.dbDeliveryId === undefined) {
          trackingInfo.dbDeliveryId = await resolveDeliveryId(deliveryId);
          if (!trackingInfo.dbDeliveryId && !trackingInfo.warnedMissingDelivery) {
            trackingInfo.warnedMissingDelivery = true;
            console.log(Logging(`[Database] Delivery not found for ID/order ${deliveryId}. Skipping DB save.`, 'warning', 'yellow'));
          }
        }

        const now = Date.now();
        const lastSavedAt = lastDbSaveMap.get(socket.id) ?? 0;
        const shouldSaveToDb =
          trackingInfo.role === UserRole.delivery &&
          !!trackingInfo.dbDeliveryId &&
          now - lastSavedAt >= DB_SAVE_INTERVAL_MS;

        // Save location to database and update Delivery.trackingCode = socketId
        if (shouldSaveToDb) {
          lastDbSaveMap.set(socket.id, now);
          try {
            console.log(Logging(`[Database] Saving location...`, 'info', 'yellow'));
            await createDeliveryLocation({
              deliveryId: trackingInfo.dbDeliveryId!,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              accuracyMeters: accuracyMeters ? parseFloat(accuracyMeters) : undefined,
              headingDegrees: headingDegrees ? parseFloat(headingDegrees) : undefined,
              speedMetersPerSecond: speedMetersPerSecond ? parseFloat(speedMetersPerSecond) : undefined,
              capturedAt: capturedDate,
            }, socket.id); // Pass socketId to set as trackingCode
            console.log(Logging(`[Database] Location saved successfully`, 'success', 'green'));
          } catch (error) {
            console.log(Logging(`[Database] Error saving location for delivery ${deliveryId}: ${error}`, 'error', 'red'));
          }
        }

        // Broadcast to all users in the delivery's room
        console.log(Logging(`[Broadcast] Emitting to room ${roomName}...`, 'info', 'magenta'));
        const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
        console.log(Logging(`[Broadcast] Room size: ${roomSize}`, 'info', 'blue'));
        io.to(roomName).emit('location:update', {
          deliveryId,
          latitude,
          longitude,
          accuracyMeters: accuracyMeters ?? null,
          headingDegrees: headingDegrees ?? null,
          speedMetersPerSecond: speedMetersPerSecond ?? null,
          capturedAt: capturedDate,
          socketId: socket.id,
          role: trackingInfo?.role,
        });
      }
    );

    // Leave tracking room
    socket.on('tracking:leave', (data: { deliveryId: string; userId: string }) => {
      console.log(Logging(`[Tracking] Received leave request: ${JSON.stringify(data)}`, 'info', 'magenta'));
      const { deliveryId, userId } = data;
      const roomName = `delivery:${deliveryId}`;

      socket.leave(roomName);
      userTrackingMap.delete(socket.id);

      console.log(Logging(`[Tracking] User ${userId} left room: ${roomName}`, 'info', 'yellow'));
      console.log(Logging(`[Tracking] Current room size: ${io.sockets.adapter.rooms.get(roomName)?.size || 0}`, 'info', 'blue'));

      // Notify other users in the room
      socket.to(roomName).emit('tracking:user-left', {
        userId,
        socketId: socket.id,
        leftAt: new Date().toISOString(),
      });
    });

    // Get current room participants (delivery + customer locations)
    socket.on(
      'tracking:get-participants',
      (data: { deliveryId: string }, callback?: (participants: any) => void) => {
        console.log(Logging(`[Participants] Request for delivery: ${data.deliveryId}`, 'info', 'magenta'));
        const { deliveryId } = data;
        const roomName = `delivery:${deliveryId}`;
        const room = io.sockets.adapter.rooms.get(roomName);

        if (!room) {
          console.log(Logging(`[Participants] Room not found: ${roomName}`, 'warning', 'yellow'));
          callback?.(null);
          return;
        }

        const participants = Array.from(room)
          .map((socketId) => {
            const trackingInfo = userTrackingMap.get(socketId);
            return trackingInfo ? buildLocationPayload(trackingInfo) : null;
          })
          .filter((participant): participant is NonNullable<ReturnType<typeof buildLocationPayload>> => !!participant);

        console.log(Logging(`[Participants] Found ${participants.length} participants`, 'success', 'green'));
        callback?.(participants);
      }
    );

    // Cleanup on disconnect
    socket.on('disconnect', (reason) => {
      console.log(Logging(`[Socket] User ${socket.id} disconnected`, 'error', 'red'));
      console.log(Logging(`[Socket] Reason: ${reason}`, 'warning', 'yellow'));
      
      const trackingInfo = userTrackingMap.get(socket.id);
      if (trackingInfo) {
        console.log(Logging(`[Tracking] User was in delivery: ${trackingInfo.deliveryId}`, 'warning', 'blue'));
        const roomName = `delivery:${trackingInfo.deliveryId}`;
        io.to(roomName).emit('tracking:user-left', {
          socketId: socket.id,
          role: trackingInfo.role,
          leftAt: new Date().toISOString(),
        });
        console.log(Logging(`[Broadcast] Notified room ${roomName} of user departure`, 'warning', 'magenta'));
      } else {
        console.log(Logging(`[Tracking] User had no tracking info`, 'warning', 'yellow'));
      }

      userTrackingMap.delete(socket.id);
      lastDbSaveMap.delete(socket.id);
      console.log(Logging(`[Cleanup] Removed user from tracking map`, 'success', 'green'));
    });

    // Error handling
    socket.on('error', (error) => {
      console.log(Logging(`[Socket] Error on ${socket.id}: ${error}`, 'error', 'red'));
    });
  });
}
