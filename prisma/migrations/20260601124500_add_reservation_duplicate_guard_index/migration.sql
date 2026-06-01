-- Speed up duplicate active reservation checks.

CREATE INDEX "reservations_clientId_serviceId_status_idx"
ON "reservations"("clientId", "serviceId", "status");
