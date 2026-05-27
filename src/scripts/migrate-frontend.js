const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../app/dashboard');

const permissionMap = {
  'visitors': 'VISITOR_MANAGE',
  'vendors': 'VENDOR_MANAGE',
  'vehicles': 'VEHICLE_MANAGE',
  'tenants': 'TENANT_MANAGE',
  'sos': 'SOS_RESPOND',
  'patrol': 'PATROL_MANAGE',
  'emergency-contacts': 'EMERGENCY_MANAGE',
  'facilities': 'FACILITY_MANAGE',
  'assets': 'ASSET_MANAGE',
  'meetings': 'MEETING_MANAGE',
  'billing': 'BILL_APPROVE',
  'complaints': 'COMPLAINT_ASSIGN',
  'members': 'USER_CREATE',
  'notices': 'NOTICE_CREATE',
  'settings': 'SOCIETY_MANAGE',
  'societies': 'SOCIETY_MANAGE',
  'reports': 'REPORT_VIEW',
  'scrollers': 'NOTICE_CREATE',
  'property-listings': 'TENANT_MANAGE'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Find which module this is based on path
  const relativePath = path.relative(srcDir, file).replace(/\\/g, '/');
  const moduleName = relativePath.split('/')[0];
  const perm = permissionMap[moduleName] || 'SOCIETY_MANAGE';

  let modified = false;

  // Add hasPermission to useAuth if it exists
  if (content.includes('useAuth') && !content.includes('hasPermission')) {
    content = content.replace(/const\s+\{\s*([^}]*?user[^}]*?)\s*\}\s*=\s*useAuth\(\)/g, (match, p1) => {
      return `const { ${p1.trim()}, hasPermission } = useAuth()`;
    });
    modified = true;
  }

  // Replace ["ADMIN", ...].includes(user?.role || "") with hasPermission('...')
  const roleCheckRegex = /\[[^\]]*\]\.includes\(\s*user\?\.role\s*\|\|?\s*['"]['"]\s*\)/g;
  if (roleCheckRegex.test(content)) {
    content = content.replace(roleCheckRegex, `hasPermission('${perm}')`);
    modified = true;
  }

  // Check (user?.role || "") === "RESIDENT"
  const exactCheckRegex = /\(\s*user\?\.role\s*\|\|?\s*['"]['"]\s*\)\s*={2,3}\s*['"]RESIDENT['"]/g;
  if (exactCheckRegex.test(content)) {
    content = content.replace(exactCheckRegex, `!hasPermission('${perm}')`); // Crude fallback
    modified = true;
  }
  
  // Replace {user?.role?.replace(...)} with position logic? This is purely cosmetic
  const cosmeticRoleRegex = /user\?\.role\?\.replace\([^\)]+\)/g;
  if (cosmeticRoleRegex.test(content)) {
    content = content.replace(cosmeticRoleRegex, `(user?.role || 'Member')`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated frontend file: ${relativePath}`);
  }
});

console.log('Frontend codemod complete!');
