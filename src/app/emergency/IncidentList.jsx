import { Card, Row, Col, Badge, Button, Spinner } from "react-bootstrap";
import { STATUS_LABELS } from "./constants";
import { prettify, formatTime } from "./utils";

export default function IncidentList({
  activeIncidents,
  recentHistory,
  loadingIncidents,
  email,
  onRoute,
  onUpdateIncident,
  onMessage,
}) {
  return (
    <Row className="g-4">
      <Col xs={12} lg={7}>
        <Card className="rg-list-panel border-0 h-100">
          <Card.Body className="p-4">
            <h2 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-broadcast text-danger"></i>
              Active Incidents
              {loadingIncidents ? (
                <Spinner animation="border" size="sm" className="ms-2" />
              ) : (
                <Badge bg="secondary" pill>
                  {activeIncidents.length}
                </Badge>
              )}
            </h2>

            {activeIncidents.length === 0 ? (
              <EmptyState
                icon="bi-check2-circle"
                text="No active incidents right now."
              />
            ) : (
              <div className="d-flex flex-column gap-3">
                {activeIncidents.map((incident) => (
                  <ActiveIncidentItem
                    key={incident._id}
                    incident={incident}
                    email={email}
                    onRoute={onRoute}
                    onUpdateIncident={onUpdateIncident}
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
              Recent Incidents
            </h2>

            {recentHistory.length === 0 ? (
              <EmptyState
                icon="bi-archive"
                text="No recent incident history yet."
              />
            ) : (
              <div className="d-flex flex-column gap-2">
                {recentHistory.map((incident) => (
                  <HistoryItem key={incident._id} incident={incident} />
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

function ActiveIncidentItem({
  incident,
  email,
  onRoute,
  onUpdateIncident,
  onMessage,
}) {
  // Reporter sees "cancel/resolve"; everyone else sees "offer help".
  // The helper (the one who claimed it) sees the "on the way / arrived" buttons.
  const isMine = incident.userEmail === email;
  const isMyHelper = incident.helperUserEmail === email;

  return (
    <div className="rg-incident-item p-3 rounded-3">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
        <div className="fw-bold">
          <i className="bi bi-person-fill me-1 text-body-secondary"></i>
          {incident.userName} <span className="text-body-secondary">•</span>{" "}
          {prettify(incident.type)}
        </div>
        <Badge bg="primary" className="px-2">
          {STATUS_LABELS[incident.status] || incident.status}
        </Badge>
      </div>

      <div className="small text-body-secondary mb-3">
        <div>
          Report type:{" "}
          {incident.reportMode === "third_party"
            ? "Reported by another rider"
            : "Self reported"}
        </div>
        {incident.reportMode === "third_party" && incident.reportedForName && (
          <div>Reported for: {incident.reportedForName}</div>
        )}
        <div>Severity: {prettify(incident.severity)}</div>
        <div>Created: {formatTime(incident.createdAt)}</div>
        <div>Helper: {incident.helperUserName || "None assigned"}</div>
        <div>Latest update: {incident.latestUpdate || "—"}</div>
      </div>

      <div className="d-flex flex-wrap gap-2">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => onRoute(incident.lng, incident.lat)}
        >
          <i className="bi bi-geo-alt-fill me-1"></i>Route
        </Button>

        {!isMine && (
          <>
            <Button
              variant="success"
              size="sm"
              onClick={() => onUpdateIncident(incident._id, "claim-help")}
            >
              <i className="bi bi-hand-thumbs-up-fill me-1"></i>Offer Help
            </Button>
            <Button
              variant="outline-info"
              size="sm"
              onClick={() =>
                onMessage(
                  incident.userEmail,
                  "Hi, I can see your incident and I'm checking in.",
                  incident
                )
              }
            >
              <i className="bi bi-chat-dots-fill me-1"></i>Message
            </Button>
          </>
        )}

        {isMyHelper && (
          <>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={async () => {
                await onRoute(incident.lng, incident.lat);
                await onUpdateIncident(incident._id, "route-started");
              }}
            >
              <i className="bi bi-signpost-2-fill me-1"></i>I'm On The Way
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => onUpdateIncident(incident._id, "arrived")}
            >
              <i className="bi bi-check-circle-fill me-1"></i>Mark Arrived
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function HistoryItem({ incident }) {
  return (
    <div className="rg-history-item p-2 rounded-2">
      <div className="fw-semibold small">
        {incident.userName} <span className="text-body-secondary">•</span>{" "}
        {prettify(incident.type)}
      </div>
      <div className="small text-body-secondary">
        {STATUS_LABELS[incident.status] || incident.status} •{" "}
        {formatTime(incident.updatedAt || incident.createdAt)}
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
