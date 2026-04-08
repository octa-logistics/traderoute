from datetime import datetime

from app.models.shipment import ShipmentStatus


VALID_SHIPMENT_TRANSITIONS = {
    ShipmentStatus.PENDING: {ShipmentStatus.PICKED, ShipmentStatus.RETURNED},
    ShipmentStatus.PICKED: {ShipmentStatus.PACKED, ShipmentStatus.RETURNED},
    ShipmentStatus.PACKED: {ShipmentStatus.SHIPPED, ShipmentStatus.RETURNED},
    ShipmentStatus.SHIPPED: {ShipmentStatus.IN_TRANSIT, ShipmentStatus.RETURNED},
    ShipmentStatus.IN_TRANSIT: {ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED},
    ShipmentStatus.DELIVERED: {ShipmentStatus.RETURNED},
    ShipmentStatus.RETURNED: set(),
}


class InvalidShipmentTransitionError(Exception):
    def __init__(self, current: ShipmentStatus, requested: ShipmentStatus):
        super().__init__(f"Cannot transition shipment from {current.value} to {requested.value}")
        self.current = current
        self.requested = requested


class ShipmentService:
    @staticmethod
    def validate_status_transition(current: ShipmentStatus, new: ShipmentStatus) -> None:
        allowed = VALID_SHIPMENT_TRANSITIONS.get(current, set())
        if new not in allowed:
            raise InvalidShipmentTransitionError(current, new)

    @staticmethod
    def apply_status_side_effects(shipment, new_status: ShipmentStatus) -> None:
        if new_status == ShipmentStatus.SHIPPED and not shipment.shippedAt:
            shipment.shippedAt = datetime.utcnow()
        elif new_status == ShipmentStatus.DELIVERED and not shipment.deliveredAt:
            shipment.deliveredAt = datetime.utcnow()
