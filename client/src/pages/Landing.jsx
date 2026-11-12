
import { useState } from "react";
import {
  Button,
  Modal,
  Card,
  DataTable,
  StatusBadge,
  useToast,
} from "../components/ui";

function Landing() {
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sample table data
  const orders = [
    {
      id: 101,
      customer: "John Doe",
      total: "$45.00",
      status: "PENDING",
    },
    {
      id: 102,
      customer: "Jane Smith",
      total: "$82.50",
      status: "PREPARING",
    },
    {
      id: 103,
      customer: "Michael James",
      total: "$120.00",
      status: "READY",
    },
    {
      id: 104,
      customer: "Sarah Williams",
      total: "$65.00",
      status: "SERVED",
    },
    {
      id: 105,
      customer: "David Brown",
      total: "$30.00",
      status: "CANCELLED",
    },
  ];

  const columns = [
    {
      header: "Order ID",
      accessorKey: "id",
    },
    {
      header: "Customer",
      accessorKey: "customer",
    },
    {
      header: "Total",
      accessorKey: "total",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const handleLoadingTest = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      showToast("Action completed successfully!", "success");
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-10">

        {/* Header */}
        <header>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            DevNest RMS
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Component Showcase
          </h1>

          <p className="mt-2 text-gray-500">
            Testing our reusable UI components before frontend development.
          </p>
        </header>

        {/* BUTTONS */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            1. Buttons
          </h2>

          <Card title="Button Variants">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">
                Primary
              </Button>

              <Button variant="secondary">
                Secondary
              </Button>

              <Button variant="danger">
                Danger
              </Button>

              <Button variant="outline">
                Outline
              </Button>

              <Button disabled>
                Disabled
              </Button>
            </div>
          </Card>

          <Card title="Button Sizes">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </Card>

          <Card title="Button Loading State">
            <Button
              loading={loading}
              onClick={handleLoadingTest}
              disabled={loading}
            >
              {loading ? "Processing..." : "Test Loading"}
            </Button>
          </Card>
        </section>

        {/* MODAL */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            2. Modal
          </h2>

          <Card title="Modal Interaction">
            <Button onClick={() => setModalOpen(true)}>
              Open Modal
            </Button>
          </Card>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirm Order"
          >
            <p className="mb-6 text-gray-600">
              Are you sure you want to confirm this order?
              This is a temporary modal test.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  setModalOpen(false);
                  showToast("Order confirmed successfully!", "success");
                }}
              >
                Confirm
              </Button>
            </div>
          </Modal>
        </section>

        {/* CARDS */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            3. Cards
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Total Orders" description="Orders received today">
              <p className="text-3xl font-bold text-gray-900">128</p>
            </Card>

            <Card title="Revenue" description="Today's revenue">
              <p className="text-3xl font-bold text-gray-900">$2,450</p>
            </Card>

            <Card title="Pending Orders" description="Awaiting preparation">
              <p className="text-3xl font-bold text-gray-900">12</p>
            </Card>
          </div>
        </section>

        {/* TOASTS */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            4. Toast Notifications
          </h2>

          <Card title="Notification Types">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  showToast("Operation completed successfully!", "success")
                }
              >
                Success
              </Button>

              <Button
                variant="danger"
                onClick={() =>
                  showToast("Something went wrong!", "error")
                }
              >
                Error
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  showToast("Please review this information.", "warning")
                }
              >
                Warning
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  showToast("Here is some useful information.", "info")
                }
              >
                Information
              </Button>
            </div>
          </Card>
        </section>

        {/* DATA TABLE */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            5. Data Table
          </h2>

          <Card title="Recent Orders" description="Sample restaurant orders">
            <DataTable
              columns={columns}
              data={orders}
              loading={false}
              emptyMessage="No orders found"
            />
          </Card>

          <Card title="Empty Table">
            <DataTable
              columns={columns}
              data={[]}
              loading={false}
              emptyMessage="No orders available"
            />
          </Card>

          <Card title="Loading Table">
            <DataTable
              columns={columns}
              data={[]}
              loading={true}
              emptyMessage="No orders found"
            />
          </Card>
        </section>

        {/* STATUS BADGES */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            6. Status Badges
          </h2>

          <Card title="Order Statuses">
            <div className="flex flex-wrap gap-3">
              {[
                "PENDING",
                "PREPARING",
                "READY",
                "SERVED",
                "CANCELLED",
              ].map((status) => (
                <StatusBadge key={status} status={status} />
              ))}
            </div>
          </Card>

          <Card title="Inventory Statuses">
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="IN_STOCK" />
              <StatusBadge status="LOW_STOCK" />
              <StatusBadge status="OUT_OF_STOCK" />
            </div>
          </Card>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
          DevNest RMS — Shared Components Testing
        </footer>

      </div>
    </main>
  );
}

export default Landing;
