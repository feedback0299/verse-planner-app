// This simple script demonstrates the collapsible implementation for Admin Portal
// in mobile navigation. Manually apply this logic to Navigation.tsx

// 1. Add state for isAdminPortalExpanded:
const [isAdminPortalExpanded, setIsAdminPortalExpanded] =useState(false);

// 2. Replace line ~322 which has:
//    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-3">Admin Portal</p>
// with:

{/* Collapsible Header */}
<button 
  onClick={() => setIsAdminPortalExpanded(!isAdminPortalExpanded)}
  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
>
  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Portal</p>
  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isAdminPortalExpanded ? 'rotate-180' : ''}`} />
</button>

//  3. Wrap all admin portal links (lines ~324-405) with:
{isAdminPortalExpanded && (
  <div className="mt-2">
    {/* All existing admin portal links go here */}
  </div>
)}
