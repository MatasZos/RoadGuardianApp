import { Form, Button, Row, Col } from "react-bootstrap";
import { MAINTENANCE_TASKS } from "@/lib/maintenance";

export default function MaintenanceForm({
  form,
  setForm,
  editingId,
  previewList,
  onSubmit,
  onToggleTask,
}) {
  return (
    <Form onSubmit={onSubmit}>
      <Form.Label className="fw-semibold">Select Tasks Done:</Form.Label>
      <div className="rg-task-checks d-flex flex-wrap gap-3 mb-3">
        {MAINTENANCE_TASKS.map((task) => (
          <Form.Check
            key={task}
            type="checkbox"
            id={`task-${task}`}
            label={task}
            checked={form.type.includes(task)}
            onChange={() => onToggleTask(task)}
          />
        ))}
      </div>

      {/* the rest of the form fields */}
      <Row className="g-3">
        {/* read only summary of which tasks are picked */}
        <Col xs={12}>
          <Form.Control
            as="textarea"
            rows={2}
            value={form.type.join(", ")}
            readOnly
            placeholder="Chosen services"
          />
        </Col>

        {/* date the work was done */}
        <Col xs={12} md={6}>
          <Form.Control
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </Col>

        {/* km on the bike at the time of service */}
        <Col xs={12} md={6}>
          <Form.Control
            type="number"
            placeholder="Kilometers"
            value={form.km}
            onChange={(e) => setForm({ ...form, km: e.target.value })}
            required
          />
        </Col>

        {/* general notes about the service */}
        <Col xs={12}>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="General notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Col>

        {/* warnings or things to keep an eye on next time */}
        <Col xs={12}>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Advisories for next service (e.g. brake pads wearing low, inspect chain soon)"
            value={form.advisories}
            onChange={(e) =>
              setForm({ ...form, advisories: e.target.value })
            }
          />
        </Col>
      </Row>

      {/* preview shown under the form telling the user when each task is due next */}
      {previewList.length > 0 && (
        <div className="rg-preview-box mt-3 p-3 rounded">
          <h3 className="h6 fw-bold mb-2">Task Due Preview</h3>
          {previewList.map((item) => (
            <p key={item.type} className="small mb-1">
              <strong>{item.type}</strong> → next due at{" "}
              {item.nextDueKm.toLocaleString()} km (
              {item.intervalKm.toLocaleString()} km interval)
            </p>
          ))}
        </div>
      )}

      {/* save button */}
      <div className="d-flex justify-content-end mt-3">
        <Button type="submit" variant="primary">
          <i className="bi bi-check2-circle me-2"></i>
          {editingId ? "Save Changes" : "Add Record"}
        </Button>
      </div>

      {/* extra styles only for this part */}
      <style jsx>{`
        :global(.rg-preview-box) {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #bbf7d0;
        }
      `}</style>
    </Form>
  );
}
