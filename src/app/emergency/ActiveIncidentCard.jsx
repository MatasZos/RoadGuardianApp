import { Card, Row, Col, Badge, Button } from "react-bootstrap";
import { STATUS_LABELS } from "./constants";
import { prettify, formatTime } from "./utils";

// Big red-bordered card the reporter sees while their own emergency is open.
export default function ActiveIncidentCard({ incident, onResolve, onCancel }) {
  return (
    <Card className="rg-active-incident border-0 shadow">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h2 className="h4 fw-bold text-danger mb-1">
              <i className="bi bi-exclamation-octagon-fill me-2"></i>
              {prettify(incident.type)}
            </h2>
            <p className="text-body-secondary mb-0">
              {STATUS_LABELS[incident.status] || incident.status}
            </p>
          </div>
          <Badge bg="danger" className="px-3 py-2 fs-6">
            {prettify(incident.severity)}
          </Badge>
        </div>

        <Row className="g-3 mb-3">
          <InfoCell label="Created" value={formatTime(incident.createdAt)} />
          <InfoCell label="Phone" value={incident.phone || "—"} />
          <InfoCell
            label="Injured"
            value={incident.injured ? "Yes" : "No"}
            highlight={incident.injured}
          />
          <InfoCell
            label="Bike rideable"
            value={incident.bikeRideable ? "Yes" : "No"}
          />
          <InfoCell label="Latest update" value={incident.latestUpdate || "—"} />
          <InfoCell
            label="Helper"
            value={incident.helperUserName || "No rider assigned yet"}
          />
        </Row>

        {incident.description && (
          <div className="mb-3">
            <div className="small fw-semibold text-body-secondary mb-1">
              DESCRIPTION
            </div>
            <p className="text-body mb-0">{incident.description}</p>
          </div>
        )}

        <div className="d-flex flex-wrap gap-2">
          <Button variant="success" onClick={onResolve}>
            <i className="bi bi-check-circle-fill me-2"></i>
            Assistance Received / Resolve
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
