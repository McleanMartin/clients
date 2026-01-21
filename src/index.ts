import { renderHtml, renderLeads, renderDeals } from "./renderHtml";

// Auto-migration function - creates tables if they don't exist
async function ensureTablesExist(env: Env): Promise<void> {
	try {
		// Always ensure leads table exists (safe to run every request because of IF NOT EXISTS)
		await env.DB.prepare(`
			CREATE TABLE IF NOT EXISTS leads (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				first_name TEXT NOT NULL,
				last_name TEXT NOT NULL,
				email TEXT NOT NULL,
				phone TEXT,
				company TEXT,
				status TEXT DEFAULT 'new',
				source TEXT,
				notes TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`).run();

		// Check if customers table exists
		const checkStmt = env.DB.prepare(
			"SELECT name FROM sqlite_master WHERE type='table' AND name='customers'"
		);
		const result = await checkStmt.first<{ name: string }>();

		// If table doesn't exist, run migration
		if (!result) {
			console.log("Tables not found. Running auto-migration...");
			
			// Drop old comments table if it exists
			await env.DB.prepare("DROP TABLE IF EXISTS comments").run();

			// Create companies table
			await env.DB.prepare(`
				CREATE TABLE IF NOT EXISTS companies (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					name TEXT NOT NULL,
					industry TEXT,
					website TEXT,
					address TEXT,
					city TEXT,
					state TEXT,
					zip_code TEXT,
					country TEXT,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`).run();

			// Create customers table
			await env.DB.prepare(`
				CREATE TABLE IF NOT EXISTS customers (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					first_name TEXT NOT NULL,
					last_name TEXT NOT NULL,
					email TEXT NOT NULL,
					phone TEXT,
					company_id INTEGER,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (company_id) REFERENCES companies(id)
				)
			`).run();

			// Create deals table
			await env.DB.prepare(`
				CREATE TABLE IF NOT EXISTS deals (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					title TEXT NOT NULL,
					customer_id INTEGER,
					company_id INTEGER,
					lead_id INTEGER,
					value REAL,
					stage TEXT NOT NULL,
					probability INTEGER,
					expected_close_date DATE,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (customer_id) REFERENCES customers(id),
					FOREIGN KEY (company_id) REFERENCES companies(id),
					FOREIGN KEY (lead_id) REFERENCES leads(id)
				)
			`).run();

			// Create activities table
			await env.DB.prepare(`
				CREATE TABLE IF NOT EXISTS activities (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					type TEXT NOT NULL,
					subject TEXT NOT NULL,
					customer_id INTEGER,
					company_id INTEGER,
					deal_id INTEGER,
					due_date DATETIME,
					status TEXT DEFAULT 'pending',
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (customer_id) REFERENCES customers(id),
					FOREIGN KEY (company_id) REFERENCES companies(id),
					FOREIGN KEY (deal_id) REFERENCES deals(id)
				)
			`).run();

			// Create notes table
			await env.DB.prepare(`
				CREATE TABLE IF NOT EXISTS notes (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					content TEXT NOT NULL,
					customer_id INTEGER,
					company_id INTEGER,
					deal_id INTEGER,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (customer_id) REFERENCES customers(id),
					FOREIGN KEY (company_id) REFERENCES companies(id),
					FOREIGN KEY (deal_id) REFERENCES deals(id)
				)
			`).run();

			// Check if we need to insert sample data
			const companyCheck = await env.DB.prepare("SELECT COUNT(*) as count FROM companies").first<{ count: number }>();
			if (companyCheck && companyCheck.count === 0) {
				console.log("Inserting sample data...");
				
				// Insert sample companies
				await env.DB.prepare(`
					INSERT INTO companies (name, industry, website, address, city, state, zip_code, country)
					VALUES
						('Acme Corp', 'Technology', 'https://acme.com', '123 Tech Street', 'San Francisco', 'CA', '94105', 'USA'),
						('TechStart Inc', 'Software', 'https://techstart.io', '456 Innovation Ave', 'Austin', 'TX', '78701', 'USA'),
						('Global Solutions', 'Consulting', 'https://globalsolutions.com', '789 Business Blvd', 'New York', 'NY', '10001', 'USA')
				`).run();

				// Insert sample customers
				await env.DB.prepare(`
					INSERT INTO customers (first_name, last_name, email, phone, company_id)
					VALUES
						('John', 'Smith', 'john.smith@acme.com', '+1-555-0101', 1),
						('Sarah', 'Johnson', 'sarah.johnson@techstart.io', '+1-555-0202', 2),
						('Michael', 'Brown', 'michael.brown@globalsolutions.com', '+1-555-0303', 3)
				`).run();

				// Insert sample leads
				await env.DB.prepare(`
					INSERT INTO leads (first_name, last_name, email, phone, company, status, source)
					VALUES
						('Alice', 'Williams', 'alice@example.com', '+1-555-0404', 'StartupXYZ', 'new', 'website'),
						('Bob', 'Davis', 'bob@example.com', '+1-555-0505', 'TechCorp', 'contacted', 'referral'),
						('Carol', 'Miller', 'carol@example.com', '+1-555-0606', 'InnovateInc', 'qualified', 'email')
				`).run();

				// Insert sample deals
				await env.DB.prepare(`
					INSERT INTO deals (title, customer_id, company_id, lead_id, value, stage, probability, expected_close_date)
					VALUES
						('Enterprise License Agreement', 1, 1, NULL, 50000.00, 'negotiation', 75, '2025-03-15'),
						('Annual Support Contract', 2, 2, NULL, 25000.00, 'proposal', 60, '2025-02-28'),
						('Consulting Engagement', 3, 3, NULL, 100000.00, 'closed-won', 100, '2025-01-30')
				`).run();
			}

			console.log("Auto-migration completed successfully");
		}
	} catch (error) {
		console.error("Error during auto-migration:", error);
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Ensure tables exist before processing any request
		await ensureTablesExist(env);
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		// API Routes
		if (path.startsWith("/api/")) {
			// GET /api/customers
			if (path === "/api/customers" && method === "GET") {
				try {
					const stmt = env.DB.prepare(`
						SELECT 
							c.id,
							c.first_name,
							c.last_name,
							c.email,
							c.phone,
							c.company_id,
							co.name as company_name,
							c.created_at,
							c.updated_at
						FROM customers c
						LEFT JOIN companies co ON c.company_id = co.id
						ORDER BY c.id
					`);
					const { results } = await stmt.all();
					return new Response(JSON.stringify(results), {
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					console.error("Error fetching customers:", error);
					return new Response(JSON.stringify({ error: "Failed to fetch customers" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// POST /api/customers
			if (path === "/api/customers" && method === "POST") {
				try {
					const body = await request.json() as {
						first_name: string;
						last_name: string;
						email: string;
						phone?: string;
						company_id?: number;
					};

					if (!body.first_name || !body.last_name || !body.email) {
						return new Response(JSON.stringify({ error: "Missing required fields" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					const stmt = env.DB.prepare(`
						INSERT INTO customers (first_name, last_name, email, phone, company_id)
						VALUES (?, ?, ?, ?, ?)
					`).bind(
						body.first_name,
						body.last_name,
						body.email,
						body.phone || null,
						body.company_id || null
					);
					await stmt.run();

					const getStmt = env.DB.prepare(`
						SELECT 
							c.id,
							c.first_name,
							c.last_name,
							c.email,
							c.phone,
							c.company_id,
							co.name as company_name,
							c.created_at,
							c.updated_at
						FROM customers c
						LEFT JOIN companies co ON c.company_id = co.id
						WHERE c.id = last_insert_rowid()
					`);
					const { results } = await getStmt.all();
					return new Response(JSON.stringify(results[0]), {
						status: 201,
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to create customer" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// PUT /api/customers/:id
			if (path.startsWith("/api/customers/") && method === "PUT") {
				try {
					const id = parseInt(path.split("/")[3]);
					if (isNaN(id)) {
						return new Response(JSON.stringify({ error: "Invalid customer ID" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					const body = await request.json() as {
						first_name: string;
						last_name: string;
						email: string;
						phone?: string;
						company_id?: number;
					};

					if (!body.first_name || !body.last_name || !body.email) {
						return new Response(JSON.stringify({ error: "Missing required fields" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					await env.DB.prepare(`
						UPDATE customers 
						SET first_name = ?, last_name = ?, email = ?, phone = ?, company_id = ?, updated_at = CURRENT_TIMESTAMP
						WHERE id = ?
					`).bind(
						body.first_name,
						body.last_name,
						body.email,
						body.phone || null,
						body.company_id || null,
						id
					).run();

					const getStmt = env.DB.prepare(`
						SELECT 
							c.id,
							c.first_name,
							c.last_name,
							c.email,
							c.phone,
							c.company_id,
							co.name as company_name,
							c.created_at,
							c.updated_at
						FROM customers c
						LEFT JOIN companies co ON c.company_id = co.id
						WHERE c.id = ?
					`).bind(id);
					const { results } = await getStmt.all();
					const customer = results[0];

					if (!customer) {
						return new Response(JSON.stringify({ error: "Customer not found" }), {
							status: 404,
							headers: { "content-type": "application/json" },
						});
					}

					return new Response(JSON.stringify(customer), {
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to update customer" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// DELETE /api/customers/:id
			if (path.startsWith("/api/customers/") && method === "DELETE") {
				try {
					const id = parseInt(path.split("/")[3]);
					if (isNaN(id)) {
						return new Response(JSON.stringify({ error: "Invalid customer ID" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					await env.DB.prepare("DELETE FROM customers WHERE id = ?").bind(id).run();
					return new Response(JSON.stringify({ success: true }), {
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to delete customer" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// GET /api/leads
			if (path === "/api/leads" && method === "GET") {
				try {
					const stmt = env.DB.prepare("SELECT * FROM leads ORDER BY created_at DESC");
					const { results } = await stmt.all();
					return new Response(JSON.stringify(results), {
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to fetch leads" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// POST /api/leads
			if (path === "/api/leads" && method === "POST") {
				try {
					const body = await request.json() as {
						first_name: string;
						last_name: string;
						email: string;
						phone?: string;
						company?: string;
						status?: string;
						source?: string;
						notes?: string;
					};

					if (!body.first_name || !body.last_name || !body.email) {
						return new Response(JSON.stringify({ error: "Missing required fields" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					const stmt = env.DB.prepare(`
						INSERT INTO leads (first_name, last_name, email, phone, company, status, source, notes)
						VALUES (?, ?, ?, ?, ?, ?, ?, ?)
					`).bind(
						body.first_name,
						body.last_name,
						body.email,
						body.phone || null,
						body.company || null,
						body.status || 'new',
						body.source || null,
						body.notes || null
					);
					await stmt.run();

					const getStmt = env.DB.prepare("SELECT * FROM leads WHERE id = last_insert_rowid()");
					const { results } = await getStmt.all();
					return new Response(JSON.stringify(results[0]), {
						status: 201,
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to create lead" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// PUT /api/leads/:id
			if (path.startsWith("/api/leads/") && method === "PUT") {
				try {
					const id = parseInt(path.split("/")[3]);
					if (isNaN(id)) {
						return new Response(JSON.stringify({ error: "Invalid lead ID" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					const body = await request.json() as {
						first_name: string;
						last_name: string;
						email: string;
						phone?: string;
						company?: string;
						status?: string;
						source?: string;
						notes?: string;
					};

					await env.DB.prepare(`
						UPDATE leads 
						SET first_name = ?, last_name = ?, email = ?, phone = ?, company = ?, 
							status = ?, source = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
						WHERE id = ?
					`).bind(
						body.first_name,
						body.last_name,
						body.email,
						body.phone || null,
						body.company || null,
						body.status || 'new',
						body.source || null,
						body.notes || null,
						id
					).run();

					const getStmt = env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(id);
					const { results } = await getStmt.all();
					return new Response(JSON.stringify(results[0]), {
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to update lead" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// DELETE /api/leads/:id
			if (path.startsWith("/api/leads/") && method === "DELETE") {
				try {
					const id = parseInt(path.split("/")[3]);
					if (isNaN(id)) {
						return new Response(JSON.stringify({ error: "Invalid lead ID" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					await env.DB.prepare("DELETE FROM leads WHERE id = ?").bind(id).run();
					return new Response(JSON.stringify({ success: true }), {
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to delete lead" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// GET /api/deals
			if (path === "/api/deals" && method === "GET") {
				try {
					const stmt = env.DB.prepare(`
						SELECT 
							d.id,
							d.title,
							d.customer_id,
							d.company_id,
							d.lead_id,
							d.value,
							d.stage,
							d.probability,
							d.expected_close_date,
							c.first_name || ' ' || c.last_name as customer_name,
							co.name as company_name,
							d.created_at,
							d.updated_at
						FROM deals d
						LEFT JOIN customers c ON d.customer_id = c.id
						LEFT JOIN companies co ON d.company_id = co.id
						ORDER BY d.created_at DESC
					`);
					const { results } = await stmt.all();
					return new Response(JSON.stringify(results), {
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to fetch deals" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// GET /api/companies
			if (path === "/api/companies" && method === "GET") {
				try {
					const stmt = env.DB.prepare("SELECT * FROM companies ORDER BY name");
					const { results } = await stmt.all();
					return new Response(JSON.stringify(results), {
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to fetch companies" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			return new Response(JSON.stringify({ error: "Not found" }), {
				status: 404,
				headers: { "content-type": "application/json" },
			});
		}

		// Page routes
		if (path === "/") {
			return new Response(renderHtml(), {
				headers: { "content-type": "text/html" },
			});
		}

		if (path === "/leads") {
			return new Response(renderLeads(), {
				headers: { "content-type": "text/html" },
			});
		}

		if (path === "/deals") {
			return new Response(renderDeals(), {
				headers: { "content-type": "text/html" },
			});
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
