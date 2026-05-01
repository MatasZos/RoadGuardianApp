import { Card, Row, Col, Badge, Button, Spinner } from "react-bootstrap";

import { EMERGENCY_STATUS_LABELS } from "./emergencyConfig";
import { humaniseLabel, formatDateTime } from "./emergencyHelpers";

export default function EmergencyList({
  activeEmergencies,
  recentHistory,
  loadingEmergencies,
  email,
  onRouteToEmergency,
  onUpdateEmergency,
  onMessage,
}) {
  return (
    <Row className="g-4">
      <Col xs={12} lg={7}>
        <Card className="rg-list-panel border-0 h-100">
          <Card.Body className="p-4">
            <h2 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-broadcast text-danger"></i>
              Active Emergencies
              {loadingEmergencies ? (
                <Spinner animation="border" size="sm" className="ms-2" />
              ) : (
                <Badge bg="secondary" pill>
                  {activeEmergencies.length}
                </Badge>
              )}
            </h2>

            {activeEmergencies.length === 0 ? (
              <EmptyState
                icon="bi-check2-circle"
                text="No active emergencies right now."
              />
            ) : (
              <div className="d-flex flex-column gap-3">
                {activeEmergencies.map((emergency) => (
                  <ActiveEmergencyItem
                    key={emergency._id}
                    emergency={emergency}
                    email={email}
                    onRouteToEmergency={onRouteToEmergency}
                    onUpdateEmergency={onUpdateEmergency}
                    onMessage={onMessage}
                  />
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col xs={12} lg={5}>
        <Card className="rg-list-panel border-0 h-100">
          <Card.Body className="p-4">
            <h2 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-clock-history text-body-secondary"></i>
              Recent History
            </h2>

            {recentHistory.length === 0 ? (
              <EmptyState icon="bi-archive" text="No recent emergencies yet." />
            ) : (
              <div className="d-flex flex-column gap-2">
                {recentHistory.map((emergency) => (
                  <HistoryItem key={emergency._id} emergency={emergency} />
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

function ActiveEmergencyItem({
  emergency,
  email,
  onRouteToEmergency,
  onUpdateEmergency,
  onMessage,
}) {
  const isReporter = emergency.userEmail === email;
  const isAssignedHelper = emergency.helperUserEmail === email;
  const hasHelper = Boolean(emergency.helperUserEmail);

  const statusLabel =
    EMERGENCY_STATUS_LABELS[emergency.status] || emergency.status;

  // Only show "Offer Help" if nobody grabbed it yet.
  const canOfferHelp = !isReporter && !hasHelper;

  // Keep the helper actions "step-based" so the UI doesn't feel noisy.
  const canMarkOnTheWay =
    isAssignedHelper &&
    (emergency.status === "helper_assigned" || emergency.status === "rider_responding");
  const canMarkArrived =
    isAssignedHelper &&
    (emergency.status === "on_the_way" || emergency.status === "help_on_the_way");
  const canMarkResolved =
    isAssignedHelper &&
    (emergency.status === "arrived" || emergency.status === "assistance_received");

  return (
    <div className="rg-emergency-item p-3 rounded-3">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
        <div className="fw-bold">
          <i className="bi bi-person-fill me-1 text-body-secondary"></i>
          {emergency.userName} <span className="text-body-secondary">•</span>{" "}
          {humaniseLabel(emergency.type)}
        </div>
        <Badge bg="primary" className="px-2">
          {statusLabel}
        </Badge>
      </div>

      {/* A short summary so helpers can decide quickly. */}
      <div className="small text-body-secondary mb-3">
        <div>
          Report type:{" "}
          {emergency.reportMode === "third_party"
            ? "Reported by another rider"
            : "Self reported"}
        </div>
        {emergency.reportMode === "third_party" && emergency.reportedForName && (
          <div>Reported for: {emergency.reportedForName}</div>
        )}
        <div>Severity: {humaniseLabel(emergency.severity)}</div>
        <div>Created: {formatDateTime(emergency.createdAt)}</div>
        <div>Helper: {emergency.helperUserName || "None assigned"}</div>
        <div>Latest update: {emergency.latestUpdate || "—"}</div>
      </div>

      <div className="d-flex flex-wrap gap-2">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => onRouteToEmergency(emergency)}
        >
          <i className="bi bi-geo-alt-fill me-1"></i>Route
        </Button>

        {!isReporter && (
          <>
            {canOfferHelp && (
              <Button
                variant="success"
                size="sm"
                onClick={() => onUpdateEmergency(emergency._id, "assign-helper")}
              >
                <i className="bi bi-hand-thumbs-up-fill me-1"></i>Offer Help
              </Button>
            )}

            <Button
              variant="outline-info"
              size="sm"
              onClick={() =>
                onMessage(
                  emergency.userEmail,
                  "Hi, I can see your emergency on the map. Are you okay?",
                  emergency
                )
              }
            >
              <i className="bi bi-chat-dots-fill me-1"></i>Message
            </Button>
          </>
        )}

        {canMarkOnTheWay && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={async () => {
              await onRouteToEmergency(emergency);
              await onUpdateEmergency(emergency._id, "on-the-way");
            }}
          >
            <i className="bi bi-signpost-2-fill me-1"></i>I'm On The Way
          </Button>
        )}

        {canMarkArrived && (
          <Button
            variant="success"
            size="sm"
            onClick={() => onUpdateEmergency(emergency._id, "mark-arrived")}
          >
            <i className="bi bi-check-circle-fill me-1"></i>Mark Arrived
          </Button>
        )}

        {canMarkResolved && (
          <Button
            variant="success"
            size="sm"
            onClick={() => onUpdateEmergency(emergency._id, "mark-resolved")}
          >
            <i className="bi bi-check2-all me-1"></i>Mark Resolved
          </Button>
        )}
      </div>
    </div>
  );
}

function HistoryItem({ emergency }) {
  return (
    <div className="rg-history-item p-2 rounded-2">
      <div className="fw-semibold small">
        {emergency.userName} <span className="text-body-secondary">•</span>{" "}
        {humaniseLabel(emergency.type)}
      </div>
      <div className="small text-body-secondary">
        {EMERGENCY_STATUS_LABELS[emergency.status] || emergency.status} •{" "}
        {formatDateTime(emergency.updatedAt || emergency.createdAt)}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="text-center text-body-secondary py-4">
      <i className={`bi ${icon} fs-1 d-block mb-2 opacity-50`}></i>
      <div className="small">{text}</div>
    </div>
  );
}
