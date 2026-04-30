//Emergency form component for creating new emergencies

import {Card,Form,Button,Row,Col,Spinner,} from "react-bootstrap";
import { INCIDENT_TYPES, SEVERITIES } from "./constants";
import { prettify } from "./utils";
export default function EmergencyForm({form,setForm,submitLoading,onSubmit,onClose,}) 
{
  // Helper function to update form state on input changes. Takes the field name and new value, and merges it into the existing form state.
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Card className="rg-emergency-panel border-0 shadow-sm">
      <Card.Body className="p-4">
        {/*Title */}
        <h2 className="h4 fw-bold mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-octagon-fill text-danger"></i>
          Create Emergency
        </h2>

        {/* Form fields */}
        <Row className="g-3">
          {/* Who am I reporting for? Self vs third party */}
          <Col xs={12} md={6}>
            <Form.Group controlId="emergencyReportMode">
              <Form.Label className="small fw-semibold text-body-secondary">
                EMERGENCY REPORT TYPE
              </Form.Label>
              <Form.Select
                value={form.reportMode}
                onChange={(e) => update("reportMode", e.target.value)}
              >
                <option value="self">I need help</option>
                <option value="third_party">I am reporting someone else</option>
              </Form.Select>
            </Form.Group>
          </Col>

          {/* Reported for name */}
          {form.reportMode === "third_party" && (
            <Col xs={12} md={6}>
              <Form.Group controlId="emergencyReportedForName">
                <Form.Label className="small fw-semibold text-body-secondary">
                  WHO ARE YOU REPORTING FOR?
                </Form.Label>
                <Form.Control
                  value={form.reportedForName}
                  onChange={(e) => update("reportedForName", e.target.value)}
                  placeholder="Rider name or short note"
                />
              </Form.Group>
            </Col>
          )}

          {/* Incident type */}
          <Col xs={12} md={6}>
            <Form.Group controlId="emergencyType">
              <Form.Label className="small fw-semibold text-body-secondary">
                INCIDENT TYPE
              </Form.Label>
              <Form.Select
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {prettify(t)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          {/* Severity — low/medium/high/critical */}
          <Col xs={12} md={6}>
            <Form.Group controlId="emergencySeverity">
              <Form.Label className="small fw-semibold text-body-secondary">
                SEVERITY
              </Form.Label>
              <Form.Select
                value={form.severity}
                onChange={(e) => update("severity", e.target.value)}
              >
                {SEVERITIES.map((level) => (
                  <option key={level} value={level}>
                    {prettify(level)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          {/* Description */}
          <Col xs={12}>
            <Form.Group controlId="emergencyDescription">
              <Form.Label className="small fw-semibold text-body-secondary">
                SHORT DESCRIPTION
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Explain what happened..."
                style={{ resize: "vertical" }}
              />
            </Form.Group>
          </Col>

          {/* Contact phone — shown to anyone who claims the emergency */}
          <Col xs={12} md={6}>
            <Form.Group controlId="emergencyPhone">
              <Form.Label className="small fw-semibold text-body-secondary">
                PHONE
              </Form.Label>
              <Form.Control
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="Contact phone"
              />
            </Form.Group>
          </Col>

          {/* Status flags */}
          <Col xs={12} md={6}>
            <div className="d-flex flex-column gap-2 h-100 justify-content-center pt-md-3">
              <Form.Check
                type="switch"
                id="emergencyInjured"
                label="Someone is injured"
                checked={form.injured}
                onChange={(e) => update("injured", e.target.checked)}
              />
              <Form.Check
                type="switch"
                id="emergencyBikeRideable"
                label="Bike is still rideable"
                checked={form.bikeRideable}
                onChange={(e) => update("bikeRideable", e.target.checked)}
              />
            </div>
          </Col>
        </Row>

        {/*Action buttons */}
        <div className="d-flex flex-wrap gap-2 mt-4">
          <Button
            variant="danger"
            onClick={onSubmit}
            disabled={submitLoading}
            size="lg"
          >
            {submitLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-send-fill me-2"></i>
                Send Emergency
              </>
            )}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={onClose}
            size="lg"
            disabled={submitLoading}
          >
            Close
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
