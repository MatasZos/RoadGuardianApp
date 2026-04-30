// the search box and list for picking a bike
import { Form, Button, Row, Col, ListGroup, Card, Spinner } from "react-bootstrap";

// shows what bike is picked and lets the user search for a different one
export default function BikeSelector({
  selectedBike,
  bikeSearch,
  setBikeSearch,
  bikeResults,
  bikeLoading,
  onSearch,
  onPick,
}) {
  return (
    <div>
      {/* shows the bike that is currently picked */}
      <Card className="rg-selected-bike border-0 mb-3">
        <Card.Body className="py-3">
          <div className="text-uppercase small text-body-secondary fw-semibold">
            Selected Bike
          </div>
          <div className="fs-5 fw-bold mt-1">
            {selectedBike || (
              <span className="text-body-secondary fw-normal">
                No bike selected yet
              </span>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* the search row with three input boxes and a button */}
      <Row className="g-2">
        <Col xs={12} md={4}>
          <Form.Control
            placeholder="Make (e.g. Kawasaki)"
            value={bikeSearch.make}
            onChange={(e) =>
              setBikeSearch({ ...bikeSearch, make: e.target.value })
            }
          />
        </Col>

        <Col xs={12} md={4}>
          <Form.Control
            placeholder="Model (e.g. Ninja)"
            value={bikeSearch.model}
            onChange={(e) =>
              setBikeSearch({ ...bikeSearch, model: e.target.value })
            }
          />
        </Col>

        <Col xs={6} md={2}>
          <Form.Control
            placeholder="Year"
            value={bikeSearch.year}
            onChange={(e) =>
              setBikeSearch({ ...bikeSearch, year: e.target.value })
            }
          />
        </Col>

        <Col xs={6} md={2}>
          <Button
            type="button"
            variant="primary"
            className="w-100"
            onClick={onSearch}
            disabled={bikeLoading}
          >
            {bikeLoading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Searching
              </>
            ) : (
              <>
                <i className="bi bi-search me-2"></i>Search
              </>
            )}
          </Button>
        </Col>
      </Row>

      {/* list of matching bikes the user can pick from */}
      {bikeResults.length > 0 && (
        <ListGroup className="rg-bike-results mt-3">
          {bikeResults.slice(0, 8).map((bike, idx) => (
            <ListGroup.Item
              key={`${bike.make}-${bike.model}-${bike.year}-${idx}`}
              action
              onClick={() => onPick(bike)}
              className="rg-bike-result-item"
            >
              <div className="fw-bold">
                {bike.make} {String(bike.model).trim()}{" "}
                <span className="text-body-secondary fw-normal">
                  ({bike.year})
                </span>
              </div>
              <div className="small text-body-secondary">
                {bike.type ? `Type: ${bike.type}` : "Tap to select"}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* extra styles only for this part */}
      <style jsx>{`
        :global(.rg-selected-bike) {
          background: rgba(0, 0, 0, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        :global(.rg-bike-result-item) {
          background: rgba(0, 0, 0, 0.25) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #fff !important;
        }
        :global(.rg-bike-result-item:hover) {
          background: rgba(var(--bs-primary-rgb), 0.18) !important;
        }
      `}</style>
    </div>
  );
}
