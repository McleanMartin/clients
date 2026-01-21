const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #fff; color: #000; padding: 20px; }
  a { color: inherit; text-decoration: none; }
  .container { max-width: 1400px; margin: 0 auto; border: 1px solid #000; background: #fff; }
  .header { background: #000; color: #fff; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 20px; font-weight: 700; }
  .nav { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .nav a, .nav button { border: 1px solid #000; padding: 8px 12px; background: #fff; cursor: pointer; }
  .nav a.active { background: #000; color: #fff; }
  .nav a:hover, .nav button:hover { background: #000; color: #fff; }
  .nav button { font: inherit; }
  .page { padding: 20px; }
  .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
  .search-filter { display: flex; gap: 10px; flex-wrap: wrap; }
  .input, select { padding: 8px 10px; border: 1px solid #000; }
  .input:focus, select:focus { outline: none; border: 2px solid #000; }
  .btn { padding: 10px 14px; border: 1px solid #000; background: #fff; cursor: pointer; }
  .btn.primary { background: #000; color: #fff; }
  .btn:hover { background: #000; color: #fff; }
  table { width: 100%; border-collapse: collapse; }
  thead { background: #000; color: #fff; }
  th, td { padding: 10px; border: 1px solid #ccc; text-align: left; }
  tbody tr:nth-child(even) { background: #f7f7f7; }
  tbody tr:hover { background: #f0f0f0; }
  .actions { display: flex; gap: 8px; }
  .empty { text-align: center; padding: 30px 10px; color: #666; }
  .muted { color: #666; font-size: 14px; }
  .pill { display: inline-block; padding: 4px 8px; border: 1px solid #000; font-size: 12px; }
  .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); align-items: center; justify-content: center; z-index: 1000; }
  .modal { background: #fff; border: 2px solid #000; padding: 18px; max-width: 520px; width: 92%; max-height: 90vh; overflow-y: auto; }
  .form-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  label { font-weight: 600; display: block; margin-bottom: 6px; }
  .login-card { max-width: 420px; margin: 60px auto; border: 1px solid #000; padding: 22px; }
`;

function layout(title: string, username: string | undefined, bodyContent: string, active: "customers" | "leads" | "deals" | null) {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">${title}</div>
      <div class="nav">
        ${username ? `
          <a href="/" class="${active === "customers" ? "active" : ""}">Customers</a>
          <a href="/leads" class="${active === "leads" ? "active" : ""}">Leads</a>
          <a href="/deals" class="${active === "deals" ? "active" : ""}">Deals</a>
          <span class="muted">Hi, ${username}</span>
          <button onclick="logout()">Logout</button>
        ` : `<a href="/login" class="active">Login</a>`}
      </div>
    </div>
    <div class="page">
      ${bodyContent}
    </div>
  </div>
  <script>
    async function logout() {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    }
  </script>
</body>
</html>`;
}

export function renderLogin() {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login - CRM</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="login-card">
    <h2 style="margin-bottom:10px;">Login</h2>
    <p class="muted" style="margin-bottom:16px;">First login creates the user automatically.</p>
    <div class="form-grid" style="grid-template-columns: 1fr;">
      <div>
        <label for="username">Username</label>
        <input id="username" class="input" />
      </div>
      <div>
        <label for="password">Password</label>
        <input id="password" type="password" class="input" />
      </div>
      <button class="btn primary" onclick="login()">Login</button>
      <div id="loginError" class="muted" style="color:#c00;"></div>
    </div>
  </div>
  <script>
    async function login() {
      const username = (document.getElementById('username') || { value: '' }).value.trim();
      const password = (document.getElementById('password') || { value: '' }).value.trim();
      const err = document.getElementById('loginError');
      err.textContent = '';
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) {
          err.textContent = data.error || 'Login failed';
          return;
        }
        window.location.href = '/';
      } catch (e) {
        err.textContent = 'Login failed (network or server error)';
      }
    }

    // Allow Enter-to-submit
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') login();
    });
  </script>
</body>
</html>`;
}

export function renderHtml(username?: string) {
	const content = `
    <div class="toolbar">
      <div class="search-filter">
        <input id="searchInput" class="input" placeholder="Search customers..." oninput="filterTable()" />
        <select id="companyFilter" onchange="filterTable()">
          <option value="">All Companies</option>
        </select>
        <span id="resultsCount" class="muted"></span>
      </div>
      <button class="btn primary" onclick="openAddModal()">+ Add Customer</button>
    </div>
    <div>
      <div id="loading" class="muted" style="padding:12px 0;">Loading customers...</div>
      <table id="customersTable" style="display:none;">
        <thead>
          <tr><th>ID</th><th>First</th><th>Last</th><th>Email</th><th>Phone</th><th>Company</th><th>Actions</th></tr>
        </thead>
        <tbody id="customersTableBody"></tbody>
      </table>
      <div id="emptyState" class="empty" style="display:none;">No customers yet. Click + Add Customer.</div>
      <div id="noResultsState" class="empty" style="display:none;">No customers match your search.</div>
    </div>

    <div id="modalOverlay" class="modal-overlay" onclick="if(event.target===this) closeModal()">
      <div class="modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <h3 id="modalTitle">Add Customer</h3>
          <button class="btn" onclick="closeModal()">Close</button>
        </div>
        <div class="form-grid">
          <div><label>First Name *</label><input id="firstName" class="input" /></div>
          <div><label>Last Name *</label><input id="lastName" class="input" /></div>
          <div><label>Email *</label><input id="email" class="input" /></div>
          <div><label>Phone</label><input id="phone" class="input" /></div>
          <div><label>Company</label><select id="companyId" class="input"><option value="">None</option></select></div>
        </div>
        <div style="margin-top:14px; display:flex; gap:10px; justify-content:flex-end;">
          <button class="btn" onclick="closeModal()">Cancel</button>
          <button class="btn primary" onclick="saveCustomer()">Save</button>
        </div>
      </div>
    </div>

    <script>
      let companies = [];
      let allCustomers = [];
      let editingCustomerId = null;

      function escapeHtml(t){ if(t==null) return ''; const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
      function escapeJs(t){ if(t==null) return ''; return String(t).replace(/\\\\/g,'\\\\\\\\').replace(/'/g,\"\\\\'\").replace(/\"/g,'\\\\\"').replace(/\\n/g,'\\\\n'); }

      async function loadCompanies() {
        const res = await fetch('/api/companies');
        if(!res.ok) return;
        companies = await res.json();
        const sel = document.getElementById('companyId');
        const filter = document.getElementById('companyFilter');
        sel.innerHTML = '<option value=\"\">None</option>';
        filter.innerHTML = '<option value=\"\">All Companies</option>';
        companies.forEach(c=>{
          const opt = document.createElement('option');
          opt.value = c.id; opt.textContent = escapeHtml(c.name);
          sel.appendChild(opt.cloneNode(true));
          filter.appendChild(opt);
        });
      }

      async function loadCustomers() {
        const loading = document.getElementById('loading');
        const table = document.getElementById('customersTable');
        const tbody = document.getElementById('customersTableBody');
        const empty = document.getElementById('emptyState');
        try {
          const res = await fetch('/api/customers');
          if(!res.ok) throw new Error('Failed to fetch customers');
          allCustomers = await res.json();
          loading.style.display='none';
          if(allCustomers.length===0){ table.style.display='none'; empty.style.display='block'; return; }
          filterTable();
        } catch(e){
          loading.textContent = 'Failed to load customers';
          console.error(e);
        }
      }

      function filterTable(){
        const term = document.getElementById('searchInput').value.toLowerCase().trim();
        const company = document.getElementById('companyFilter').value;
        const table = document.getElementById('customersTable');
        const tbody = document.getElementById('customersTableBody');
        const empty = document.getElementById('emptyState');
        const noRes = document.getElementById('noResultsState');
        const count = document.getElementById('resultsCount');
        const filtered = allCustomers.filter(c=>{
          const s = term==='' || c.first_name.toLowerCase().includes(term) || c.last_name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term) || (c.company_name||'').toLowerCase().includes(term);
          const m = !company || (c.company_id && c.company_id.toString()===company);
          return s && m;
        });
        if(allCustomers.length===0){ table.style.display='none'; empty.style.display='block'; noRes.style.display='none'; count.textContent=''; return; }
        if(filtered.length===0){ table.style.display='none'; empty.style.display='none'; noRes.style.display='block'; count.textContent=''; return; }
        table.style.display='table'; empty.style.display='none'; noRes.style.display='none';
        tbody.innerHTML = filtered.map(c=>\`
          <tr>
            <td>\${escapeHtml(c.id)}</td>
            <td>\${escapeHtml(c.first_name)}</td>
            <td>\${escapeHtml(c.last_name)}</td>
            <td>\${escapeHtml(c.email)}</td>
            <td>\${escapeHtml(c.phone||'-')}</td>
            <td>\${escapeHtml(c.company_name||'-')}</td>
            <td>
              <div class="actions">
                <button class="btn" onclick="editCustomer(\${c.id}, '\${escapeJs(c.first_name)}', '\${escapeJs(c.last_name)}', '\${escapeJs(c.email)}', '\${escapeJs(c.phone||'')}', \${c.company_id||'null'})">Edit</button>
                <button class="btn" onclick="deleteCustomer(\${c.id})">Delete</button>
              </div>
            </td>
          </tr>\`).join('');
        count.textContent = term||company ? \`Showing \${filtered.length} of \${allCustomers.length}\` : \`\${allCustomers.length} total\`;
      }

      function openAddModal(){ editingCustomerId=null; document.getElementById('modalTitle').textContent='Add Customer'; document.getElementById('firstName').value=''; document.getElementById('lastName').value=''; document.getElementById('email').value=''; document.getElementById('phone').value=''; document.getElementById('companyId').value=''; document.getElementById('modalOverlay').style.display='flex'; }
      function editCustomer(id,f,l,e,p,companyId){ editingCustomerId=id; document.getElementById('modalTitle').textContent='Edit Customer'; document.getElementById('firstName').value=f; document.getElementById('lastName').value=l; document.getElementById('email').value=e; document.getElementById('phone').value=p||''; document.getElementById('companyId').value=companyId||''; document.getElementById('modalOverlay').style.display='flex'; }
      function closeModal(){ document.getElementById('modalOverlay').style.display='none'; editingCustomerId=null; }

      async function saveCustomer(){
        const body = {
          first_name: (document.getElementById('firstName') || { value: '' }).value.trim(),
          last_name: (document.getElementById('lastName') || { value: '' }).value.trim(),
          email: (document.getElementById('email') || { value: '' }).value.trim(),
          phone: ((document.getElementById('phone') || { value: '' }).value.trim()) || null,
          company_id: ((document.getElementById('companyId') || { value: '' }).value) || null
        };
        if(!body.first_name || !body.last_name || !body.email){ alert('First, last, email required'); return; }
        const url = editingCustomerId ? \`/api/customers/\${editingCustomerId}\` : '/api/customers';
        const method = editingCustomerId ? 'PUT' : 'POST';
        const res = await fetch(url,{ method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
        if(!res.ok){ const d=await res.json().catch(()=>({})); alert(d.error||'Save failed'); return; }
        closeModal(); loadCustomers();
      }

      async function deleteCustomer(id){
        if(!confirm('Delete customer?')) return;
        const res = await fetch(\`/api/customers/\${id}\`,{method:'DELETE'});
        if(!res.ok){ const d=await res.json().catch(()=>({})); alert(d.error||'Delete failed'); return; }
        loadCustomers();
      }

      loadCompanies(); loadCustomers();
    </script>
  `;
	return layout("CRM - Customers", username, content, "customers");
}

export function renderLeads(username?: string) {
	const content = `
    <div class="toolbar">
      <div class="search-filter">
        <input id="leadSearch" class="input" placeholder="Search leads..." oninput="filterLeads()" />
        <select id="leadStatusFilter" onchange="filterLeads()">
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
        </select>
      </div>
      <button class="btn primary" onclick="openLeadModal()">+ Add Lead</button>
    </div>
    <div>
      <div id="leadLoading" class="muted" style="padding:12px 0;">Loading leads...</div>
      <table id="leadsTable" style="display:none;">
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Status</th><th>Source</th><th>Actions</th></tr></thead>
        <tbody id="leadsBody"></tbody>
      </table>
      <div id="leadsEmpty" class="empty" style="display:none;">No leads yet.</div>
      <div id="leadsNoRes" class="empty" style="display:none;">No leads match your search.</div>
    </div>

    <div id="leadModal" class="modal-overlay" onclick="if(event.target===this) closeLeadModal()">
      <div class="modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <h3 id="leadModalTitle">Add Lead</h3>
          <button class="btn" onclick="closeLeadModal()">Close</button>
        </div>
        <div class="form-grid">
          <div><label>First Name *</label><input id="leadFirst" class="input"/></div>
          <div><label>Last Name *</label><input id="leadLast" class="input"/></div>
          <div><label>Email *</label><input id="leadEmail" class="input"/></div>
          <div><label>Phone</label><input id="leadPhone" class="input"/></div>
          <div><label>Company</label><input id="leadCompany" class="input"/></div>
          <div><label>Status</label><select id="leadStatus" class="input"><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option></select></div>
          <div><label>Source</label><input id="leadSource" class="input"/></div>
          <div style="grid-column:1/-1;"><label>Notes</label><input id="leadNotes" class="input"/></div>
        </div>
        <div style="margin-top:14px;display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn" onclick="closeLeadModal()">Cancel</button>
          <button class="btn primary" onclick="saveLead()">Save</button>
        </div>
      </div>
    </div>

    <script>
      let leads = []; let editingLeadId = null;
      function escapeHtml(t){ if(t==null) return ''; const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
      function escapeJs(t){ if(t==null) return ''; return String(t).replace(/\\\\/g,'\\\\\\\\').replace(/'/g,\"\\\\'\").replace(/\"/g,'\\\\\"').replace(/\\n/g,'\\\\n'); }

      async function loadLeads(){
        const l=document.getElementById('leadLoading'); const table=document.getElementById('leadsTable'); const empty=document.getElementById('leadsEmpty');
        try{
          const res=await fetch('/api/leads');
          if(!res.ok) throw new Error('Failed to load leads');
          leads=await res.json(); l.style.display='none';
          if(leads.length===0){ table.style.display='none'; empty.style.display='block'; return; }
          filterLeads();
        }catch(e){ l.textContent='Failed to load leads'; console.error(e); }
      }

      function filterLeads(){
        const term=((document.getElementById('leadSearch') || { value: '' }).value).toLowerCase().trim();
        const status=((document.getElementById('leadStatusFilter') || { value: '' }).value);
        const table=document.getElementById('leadsTable'); const body=document.getElementById('leadsBody'); const empty=document.getElementById('leadsEmpty'); const noRes=document.getElementById('leadsNoRes');
        const filtered=leads.filter(l=>{
          const s=term==='' || l.first_name.toLowerCase().includes(term) || l.last_name.toLowerCase().includes(term) || l.email.toLowerCase().includes(term) || (l.company||'').toLowerCase().includes(term);
          const st=!status || l.status===status;
          return s && st;
        });
        if(leads.length===0){ table.style.display='none'; empty.style.display='block'; noRes.style.display='none'; return; }
        if(filtered.length===0){ table.style.display='none'; empty.style.display='none'; noRes.style.display='block'; return; }
        table.style.display='table'; empty.style.display='none'; noRes.style.display='none';
        body.innerHTML = filtered.map(l=>\`
          <tr>
            <td>\${escapeHtml(l.id)}</td>
            <td>\${escapeHtml(l.first_name)} \${escapeHtml(l.last_name)}</td>
            <td>\${escapeHtml(l.email)}</td>
            <td>\${escapeHtml(l.phone||'-')}</td>
            <td>\${escapeHtml(l.company||'-')}</td>
            <td><span class="pill">\${escapeHtml(l.status||'new')}</span></td>
            <td>\${escapeHtml(l.source||'-')}</td>
            <td>
              <div class="actions">
                <button class="btn" onclick="editLead(\${l.id}, '\${escapeJs(l.first_name)}', '\${escapeJs(l.last_name)}', '\${escapeJs(l.email)}', '\${escapeJs(l.phone||'')}', '\${escapeJs(l.company||'')}', '\${escapeJs(l.status||'new')}', '\${escapeJs(l.source||'')}', '\${escapeJs(l.notes||'')}')">Edit</button>
                <button class="btn" onclick="deleteLead(\${l.id})">Delete</button>
              </div>
            </td>
          </tr>\`).join('');
      }

      function openLeadModal(){ editingLeadId=null; document.getElementById('leadModalTitle').textContent='Add Lead'; setLeadForm(); document.getElementById('leadModal').style.display='flex'; }
      function editLead(id,f,l,e,p,c,status,source,notes){ editingLeadId=id; document.getElementById('leadModalTitle').textContent='Edit Lead'; setLeadForm({f,l,e,p,c,status,source,notes}); document.getElementById('leadModal').style.display='flex'; }
      function setLeadForm(v={f:'',l:'',e:'',p:'',c:'',status:'new',source:'',notes:''}){
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
        setVal('leadFirst', v.f||''); setVal('leadLast', v.l||''); setVal('leadEmail', v.e||''); setVal('leadPhone', v.p||''); setVal('leadCompany', v.c||'');
        setVal('leadStatus', v.status||'new'); setVal('leadSource', v.source||''); setVal('leadNotes', v.notes||'');
      }
      function closeLeadModal(){ document.getElementById('leadModal').style.display='none'; editingLeadId=null; }

      async function saveLead(){
        const body = {
          first_name: (document.getElementById('leadFirst') || { value: '' }).value.trim(),
          last_name: (document.getElementById('leadLast') || { value: '' }).value.trim(),
          email: (document.getElementById('leadEmail') || { value: '' }).value.trim(),
          phone: ((document.getElementById('leadPhone') || { value: '' }).value.trim())||null,
          company: ((document.getElementById('leadCompany') || { value: '' }).value.trim())||null,
          status: ((document.getElementById('leadStatus') || { value: 'new' }).value) || 'new',
          source: ((document.getElementById('leadSource') || { value: '' }).value.trim())||null,
          notes: ((document.getElementById('leadNotes') || { value: '' }).value.trim())||null,
        };
        if(!body.first_name || !body.last_name || !body.email){ alert('First, last, email required'); return; }
        const url = editingLeadId ? \`/api/leads/\${editingLeadId}\` : '/api/leads';
        const method = editingLeadId ? 'PUT' : 'POST';
        const res = await fetch(url,{method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
        if(!res.ok){ const d=await res.json().catch(()=>({})); alert(d.error||'Save failed'); return; }
        closeLeadModal(); loadLeads();
      }

      async function deleteLead(id){
        if(!confirm('Delete lead?')) return;
        const res = await fetch(\`/api/leads/\${id}\`,{method:'DELETE'});
        if(!res.ok){ const d=await res.json().catch(()=>({})); alert(d.error||'Delete failed'); return; }
        loadLeads();
      }

      loadLeads();
    </script>
  `;
	return layout("CRM - Leads", username, content, "leads");
}

export function renderDeals(username?: string) {
	const content = `
    <div class="toolbar">
      <div class="muted">Deals (read-only list)</div>
    </div>
    <div>
      <div id="dealLoading" class="muted" style="padding:12px 0;">Loading deals...</div>
      <table id="dealsTable" style="display:none;">
        <thead><tr><th>Title</th><th>Customer</th><th>Company</th><th>Value</th><th>Stage</th><th>Probability</th><th>Expected Close</th></tr></thead>
        <tbody id="dealsBody"></tbody>
      </table>
      <div id="dealsEmpty" class="empty" style="display:none;">No deals yet.</div>
    </div>
    <script>
      function escapeHtml(t){ if(t==null) return ''; const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
      async function loadDeals(){
        const l=document.getElementById('dealLoading'); const table=document.getElementById('dealsTable'); const body=document.getElementById('dealsBody'); const empty=document.getElementById('dealsEmpty');
        try{
          const res=await fetch('/api/deals');
          if(!res.ok) throw new Error('Failed to load deals');
          const deals=await res.json(); l.style.display='none';
          if(deals.length===0){ table.style.display='none'; empty.style.display='block'; return; }
          table.style.display='table';
          body.innerHTML = deals.map(d=>\`
            <tr>
              <td>\${escapeHtml(d.title)}</td>
              <td>\${escapeHtml(d.customer_name||'-')}</td>
              <td>\${escapeHtml(d.company_name||'-')}</td>
              <td>\${d.value!=null ? '$'+d.value : '-'}</td>
              <td><span class="pill">\${escapeHtml(d.stage)}</span></td>
              <td>\${d.probability!=null ? d.probability+'%' : '-'}</td>
              <td>\${escapeHtml(d.expected_close_date||'-')}</td>
            </tr>\`).join('');
        }catch(e){ l.textContent='Failed to load deals'; console.error(e); }
      }
      loadDeals();
    </script>
  `;
	return layout("CRM - Deals", username, content, "deals");
}

