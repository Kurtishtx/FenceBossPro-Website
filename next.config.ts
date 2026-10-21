import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Same-topic duplicate articles were merged into one (two pages on one topic compete with each
     other in search). Each removed article redirects permanently to the one that was kept. */
  async redirects() {
    return [
      { source: '/blogs/fence-repair-jobs-software-scheduling', destination: '/blogs/fence-repair-job-management-software', permanent: true },
      { source: '/blogs/fence-estimate-to-scheduled-job-board', destination: '/blogs/estimate-to-scheduled-fence-job', permanent: true },
      { source: '/blogs/fencing-software-roi-what-fence-companies-save', destination: '/blogs/fence-contractor-software-roi', permanent: true },
    ];
  },
};

export default nextConfig;
