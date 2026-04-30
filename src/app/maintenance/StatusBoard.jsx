// the side panel that shows what is overdue, due soon and upcoming
import { Card, Badge, Stack } from "react-bootstrap";

// one little card showing a single task with its status and km info
function TaskCard({ task, showUrgent }) {
  return (
    <Card className="rg-task-card border-0 mb-2">
      <Card.Body className="py-2 px-3">
        {/* task name and the colored status pill */}
        <div className="d-flex justify-content-between align-items-center mb-1">
          <strong className="small">{task.type}</strong>
          <Badge
            pill
            style={{ background: task.status.color, color: "#0b0f17" }}
          >
            {task.status.label}
          </Badge>
        </div>

        <div className="small text-body-secondary">
          Last service: {task.lastServiceKm.toLocaleString()} km
        </div>
        <div className="small text-body-secondary">
          Next due: {task.nextDueKm.toLocaleString()} km
        </div>

        {/* show a different message for overdue tasks */}
        {showUrgent ? (
          <div className="small text-danger fw-semibold mt-1">
            Get checked immediately.
          </div>
        ) : (
          <div className="small text-body-secondary">
            Remaining: {task.remainingKm.toLocaleString()} km
          </div>
        )}

        {/* extra warning notes left on the record */}
        {task.advisories && (
          <div className="rg-advisory-box small mt-2 p-2 rounded">
            <strong>Advisories:</strong> {task.advisories}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

// the three groups of tasks shown on the panel
const COLUMNS = [
  { key: "overdue", label: "Overdue", color: "#ef4444", urgent: true, limit: 4 },
  { key: "dueSoon", label: "Due Soon", color: "#f59e0b", urgent: false, limit: 4 },
  { key: "upcoming", label: "Upcoming", color: "#22c55e", urgent: false, limit: 4 },
];

// fallback text when there is nothing to show in a group
const EMPTY = {
  overdue: "No overdue tasks",
  dueSoon: "Nothing due soon",
  upcoming: "No upcoming tasks yet",
};

// the main side panel
export default function StatusBoard({ summary, selectedBike }) {
  return (
    <Card className="rg-section-card border-0">
      <Card.Body>
        {/* the title at the top */}
        <div className="mb-3">
          <h2 className="h5 fw-bold mb-1">
            <i className="bi bi-speedometer2 me-2 text-primary"></i>
            Bike Service Intelligence
          </h2>
          <p className="text-body-secondary small mb-0">
            {summary
              ? `${summary.bike} · Estimated current km: ${summary.currentKm.toLocaleString()}`
              : selectedBike
              ? `${selectedBike} · No service data yet`
              : "Select a bike to view service intelligence"}
          </p>
        </div>

        {/* one section for each task group */}
        <Stack gap={3}>
          {COLUMNS.map(({ key, label, color, urgent, limit }) => {
            const tasks = summary ? summary[key].slice(0, limit) : [];

            return (
              <div key={key}>
                <h3
                  className="h6 fw-bold mb-2"
                  style={{ color }}
                >
                  {label}
                </h3>

                {tasks.length === 0 ? (
                  <p className="small text-body-secondary mb-0">
                    {EMPTY[key]}
                  </p>
                ) : (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.type}
                      task={task}
                      showUrgent={urgent}
                    />
                  ))
                )}
              </div>
            );
          })}
        </Stack>
      </Card.Body>

      {/* extra styles only for this part */}
      <style jsx>{`
        :global(.rg-task-card) {
          background: rgba(0, 0, 0, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
        }
        :global(.rg-advisory-box) {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fde68a;
        }
      `}</style>
    </Card>
  );
}
