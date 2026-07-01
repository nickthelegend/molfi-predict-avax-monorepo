import { motion } from "framer-motion";

export const PageLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <motion.div
          className="h-8 w-32 rounded-md bg-muted"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex gap-4">
          <motion.div
            className="h-8 w-24 rounded-md bg-muted"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          />
          <motion.div
            className="h-8 w-8 rounded-full bg-muted"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="space-y-6">
        {/* Title skeleton */}
        <motion.div
          className="h-10 w-64 rounded-md bg-muted"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
        />

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="h-48 rounded-lg bg-muted"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut", 
                delay: 0.1 * i 
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const MarketDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Back button */}
      <motion.div
        className="h-8 w-24 rounded-md bg-muted mb-6"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            className="h-12 w-3/4 rounded-md bg-muted"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          />
          <motion.div
            className="h-64 rounded-lg bg-muted"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
          <motion.div
            className="h-32 rounded-lg bg-muted"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <motion.div
            className="h-48 rounded-lg bg-muted"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
          <motion.div
            className="h-32 rounded-lg bg-muted"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <motion.div
        className="h-10 w-48 rounded-md bg-muted mb-6"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Table header */}
      <div className="flex gap-4 mb-4 pb-4 border-b border-border">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="h-6 flex-1 rounded bg-muted"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.05 * i }}
          />
        ))}
      </div>

      {/* Table rows */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
        <div key={row} className="flex gap-4 py-3 border-b border-border/50">
          {[1, 2, 3, 4].map((col) => (
            <motion.div
              key={col}
              className="h-8 flex-1 rounded bg-muted"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut", 
                delay: 0.05 * (row + col) 
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-24 rounded-lg bg-muted"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 * i }}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="h-72 rounded-lg bg-muted"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        />
        <motion.div
          className="h-72 rounded-lg bg-muted"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
      </div>
    </div>
  );
};
