import { Card, Button, Stack } from "react-bootstrap";
import { formatDisplayDate } from "@/lib/maintenance";

export default function MaintenanceTimeline({ monthSections, onEdit, onDelete }) {
  if (monthSections.length === 0) {
    return (
      <p className="text-body-secondary mb-0">No maintenance records yet</p>
    );
  }

  return (
    <div className="rg-timeline">
      {monthSections.map(([month, items]) => (
        <div key={month} className="mb-4">
          <h2 className="h6 fw-bold text-uppercase text-body-secondary mb-3">
            {month}
          </h2>

          <Stack gap={2}>
            {items.map((r) => (
              <Card key={r._id} className="rg-timeline-card border-0">
                <Card.Body>
                  <h3 className="h6 fw-bold mb-2">
                    {Array.isArray(r.type) ? r.type.join(", ") : r.type}
                  </h3>

                  {r.motorbike && (
                    <div className="small mb-1">
                      <strong>Bike:</strong> {r.motorbike}
                    </div>
                  )}
                  <div className="small mb-1">
                    <strong>Date:</strong> {formatDisplayDate(r.date)}
                  </div>
                  <div className="small mb-1">
                    <strong>KM serviced at:</strong>{" "}
                    {Number(r.km).toLocaleString()}
                  </div>

                  {r.notes && (
                    <p className="small text-body-secondary mt-2 mb-0">
                      {r.notes}
                    </p>
                  )}

                  {r.advisories && (
                    <div className="rg-advisory-box small mt-2 p-2 rounded">
                      <strong>Advisories:</strong> {r.advisories}
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => onEdit(r)}
                    >
                      <i className="bi bi-pencil me-1"></i>Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => onDelete(r._id)}
                    >
                      <i className="bi bi-trash me-1"></i>Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </Stack>
        </div>
      ))}

      <style jsx>{`
        :global(.rg-timeline-card) {
          background: rgba(0, 0, 0, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
        }
        :global(.rg-advisory-box) {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fde68a;
        }
      `}</style>
    </div>
  );
}
