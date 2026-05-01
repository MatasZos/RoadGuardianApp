import { Card, Row, Col, Badge, Button } from "react-bootstrap";
import { EMERGENCY_STATUS_LABELS } from "./emergencyConfig";
import { humaniseLabel, formatDateTime } from "./emergencyHelpers";

// Big red-bordered card the reporter sees while their own emergency is still active.
export default function ActiveEmergencyCard({ emergency, onResolve, onCancel }) {
  return (
    <Card className="rg-active-emergency border-0 shadow">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h2 className="h4 fw-bold text-danger mb-1">
              <i className="bi bi-exclamation-octagon-fill me-2"></i>
              {humaniseLabel(emergency.type)}
            </h2>
            <p className="text-body-secondary mb-0">
              {EMERGENCY_STATUS_LABELS[emergency.status] || emergency.status}
            </p>
          </div>
          <Badge bg="danger" className="px-3 py-2 fs-6">
            {humaniseLabel(emergency.severity)}
          </Badge>
        </div>

        {/* Quick info so the reporter can sanity-check the details they sent. */}
        <Row className="g-3 mb-3">
          <InfoCell label="Created" value={formatDateTime(emergency.createdAt)} />
          <InfoCell label="Phone" value={emergency.phone || "—"} />
          <InfoCell
            label="Injured"
            value={emergency.injured ? "Yes" : "No"}
            highlight={emergency.injured}
          />
          <InfoCell
            label="Bike rideable"
            value={emergency.bikeRideable ? "Yes" : "No"}
          />
          <InfoCell label="Latest update" value={emergency.latestUpdate || "—"} />
          <InfoCell
            label="Helper"
            value={emergency.helperUserName || "No rider assigned yet"}
          />
        </Row>

        {emergency.description && (
          <div className="mb-3">
            <div className="small fw-semibold text-body-secondary mb-1">
              DESCRIPTION
            </div>
            <p className="text-body mb-0">{emergency.description}</p>
          </div>
        )}

        {/* The two actions the reporter always needs. */}
        <div className="d-flex flex-wrap gap-2">
          <Button variant="success" onClick={onResolve}>
            <i className="bi bi-check-circle-fill me-2"></i>
            Mark Resolved
          </Button>
          <Button variant="outline-danger" onClick={onCancel}>
            <i className="bi bi-x-circle-fill me-2"></i>
            Cancel Request
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

function InfoCell({ label, value, highlight }) {
  return (
    <Col xs={12} sm={6} md={4}>
      <div className="small fw-semibold text-body-secondary text-uppercase">
        {label}
      </div>
      <div className={`fw-semibold ${highlight ? "text-danger" : ""}`}>
        {value}
      </div>
    </Col>
  );
}
