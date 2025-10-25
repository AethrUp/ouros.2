export default function TestSpacing() {
  return (
    <div className="min-h-screen bg-background-primary p-8">
      <h1 className="text-2xl font-bold mb-6">Spacing Test Page</h1>

      <div className="space-y-4">
        {/* Padding Tests */}
        <div className="bg-card p-4">
          <p>p-4 (1rem padding)</p>
        </div>

        <div className="bg-card p-8">
          <p>p-8 (2rem padding)</p>
        </div>

        {/* Margin Tests */}
        <div className="bg-card p-4 mt-8">
          <p>mt-8 (2rem margin-top)</p>
        </div>

        <div className="bg-card p-4 mb-12">
          <p>mb-12 (3rem margin-bottom)</p>
        </div>

        {/* Mixed spacing */}
        <div className="bg-card px-6 py-3 mx-4 my-8">
          <p>px-6 py-3 mx-4 my-8</p>
        </div>

        {/* Gap test */}
        <div className="flex gap-4 bg-card p-4">
          <div className="bg-primary p-2">Item 1</div>
          <div className="bg-primary p-2">Item 2</div>
          <div className="bg-primary p-2">Item 3</div>
        </div>
      </div>
    </div>
  );
}
