const fs = require('fs');

const files = [
  'OperationsDashboard.tsx', 
  'EmployeePerformanceDashboard.tsx', 
  'CustomerInsightsDashboard.tsx', 
  'ManagementDashboard.tsx', 
  'AuditDashboard.tsx'
];

files.forEach(f => {
  const p = 'src/components/reports/' + f;
  let c = fs.readFileSync(p, 'utf8');
  // replace backslash followed by backtick
  c = c.replace(/\\`/g, '`');
  // replace backslash followed by dollar sign
  c = c.replace(/\\\$/g, '$');
  fs.writeFileSync(p, c);
  console.log('Fixed', f);
});
