import { renderHtml } from "./renderHtml";

// Auto-migration function - creates tables if they don't exist
async function ensureTablesExist(env: Env): Promise<void> {
	try {
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
					value REAL,
					stage TEXT NOT NULL,
					probability INTEGER,
					expected_close_date DATE,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (customer_id) REFERENCES customers(id),
					FOREIGN KEY (company_id) REFERENCES companies(id)
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

				// Insert sample deals
				await env.DB.prepare(`
					INSERT INTO deals (title, customer_id, company_id, value, stage, probability, expected_close_date)
					VALUES
						('Enterprise License Agreement', 1, 1, 50000.00, 'negotiation', 75, '2025-03-15'),
						('Annual Support Contract', 2, 2, 25000.00, 'proposal', 60, '2025-02-28'),
						('Consulting Engagement', 3, 3, 100000.00, 'closed-won', 100, '2025-01-30')
				`).run();

				// Insert sample activities
				await env.DB.prepare(`
					INSERT INTO activities (type, subject, customer_id, company_id, deal_id, due_date, status)
					VALUES
						('call', 'Follow-up call on proposal', 1, 1, 1, '2025-01-20 14:00:00', 'pending'),
						('meeting', 'Product demonstration', 2, 2, 2, '2025-01-18 10:00:00', 'completed'),
						('email', 'Send contract details', 3, 3, 3, '2025-01-16 09:00:00', 'completed')
				`).run();

				// Insert sample notes
				await env.DB.prepare(`
					INSERT INTO notes (content, customer_id, company_id, deal_id)
					VALUES
						('Customer showed strong interest in enterprise features. Follow up next week.', 1, 1, 1),
						('Decision maker is the CTO. Technical requirements are clear.', 2, 2, 2),
						('Contract signed. Project kickoff scheduled for next month.', 3, 3, 3)
				`).run();
			}

			console.log("Auto-migration completed successfully");
		}
	} catch (error) {
		console.error("Error during auto-migration:", error);
		// Don't throw - let the request continue, it will show a proper error
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
			// GET /api/customers - Get all customers with company names
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
						headers: {
							"content-type": "application/json",
						},
					});
				} catch (error) {
					console.error("Error fetching customers:", error);
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return new Response(JSON.stringify({ 
						error: "Failed to fetch customers",
						details: errorMessage 
					}), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// POST /api/customers - Create a new customer
			if (path === "/api/customers" && method === "POST") {
				try {
					const body = await request.json() as {
						first_name: string;
						last_name: string;
						email: string;
						phone?: string;
						company_id?: number;
					};

					// Validate required fields
					if (!body.first_name || !body.last_name || !body.email) {
						return new Response(JSON.stringify({ error: "Missing required fields" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					// Insert customer
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

					// Get the created customer
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
					const customer = results[0];

					return new Response(JSON.stringify(customer), {
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

			// PUT /api/customers/:id - Update a customer
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

					// Validate required fields
					if (!body.first_name || !body.last_name || !body.email) {
						return new Response(JSON.stringify({ error: "Missing required fields" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					// Update customer
					const stmt = env.DB.prepare(`
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
					);

					await stmt.run();

					// Get the updated customer
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

			// DELETE /api/customers/:id - Delete a customer
			if (path.startsWith("/api/customers/") && method === "DELETE") {
				try {
					const id = parseInt(path.split("/")[3]);
					if (isNaN(id)) {
						return new Response(JSON.stringify({ error: "Invalid customer ID" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					const stmt = env.DB.prepare("DELETE FROM customers WHERE id = ?").bind(id);
					await stmt.run();

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

			// GET /api/companies - Get all companies
			if (path === "/api/companies" && method === "GET") {
				try {
					const stmt = env.DB.prepare("SELECT * FROM companies ORDER BY name");
					const { results } = await stmt.all();
					return new Response(JSON.stringify(results), {
						headers: {
							"content-type": "application/json",
						},
					});
				} catch (error) {
					console.error("Error fetching companies:", error);
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return new Response(JSON.stringify({ 
						error: "Failed to fetch companies",
						details: errorMessage 
					}), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// 404 for unknown API routes
			return new Response(JSON.stringify({ error: "Not found" }), {
				status: 404,
				headers: { "content-type": "application/json" },
			});
		}

		// Root path - render HTML
		if (path === "/") {
			return new Response(renderHtml(), {
				headers: {
					"content-type": "text/html",
				},
			});
		}

		// 404 for other routes
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
