import { renderHtml, renderLogin, renderLeads, renderDeals } from "./renderHtml";

// Simple session management using cookies
function getSessionId(request: Request): string | null {
	const cookieHeader = request.headers.get("Cookie");
	if (!cookieHeader) return null;
	const cookies = cookieHeader.split(";").map(c => c.trim());
	const sessionCookie = cookies.find(c => c.startsWith("session="));
	return sessionCookie ? sessionCookie.split("=")[1] : null;
}

function setSessionCookie(sessionId: string): string {
	return `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}

function clearSessionCookie(): string {
	return `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// Auto-migration function - creates tables if they don't exist
async function ensureTablesExist(env: Env): Promise<void> {
	try {
		// Always ensure auth tables exist (safe to run every request because of IF NOT EXISTS)
		await env.DB.prepare(`
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT NOT NULL UNIQUE,
				password_hash TEXT NOT NULL,
				is_admin INTEGER DEFAULT 0,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`).run();

		await env.DB.prepare(`
			CREATE TABLE IF NOT EXISTS sessions (
				id TEXT PRIMARY KEY,
				user_id INTEGER NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				expires_at DATETIME NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(id)
			)
		`).run();

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

// Simple password hashing (for demo - use proper hashing in production)
async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
	const passwordHash = await hashPassword(password);
	return passwordHash === hash;
}

// Authentication middleware
async function checkAuth(request: Request, env: Env): Promise<{ userId: number; username: string } | null> {
	const sessionId = getSessionId(request);
	if (!sessionId) return null;

	try {
		const stmt = env.DB.prepare(`
			SELECT s.user_id, u.username 
			FROM sessions s
			JOIN users u ON s.user_id = u.id
			WHERE s.id = ? AND s.expires_at > datetime('now')
		`).bind(sessionId);
		const result = await stmt.first<{ user_id: number; username: string }>();
		return result ? { userId: result.user_id, username: result.username } : null;
	} catch (error) {
		console.error("Auth check error:", error);
		return null;
	}
}

function generateSessionId(): string {
	return crypto.randomUUID();
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Ensure tables exist before processing any request
		await ensureTablesExist(env);
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		// Public routes - login and API login
		if (path === "/login" || path === "/api/login") {
			if (method === "GET") {
				return new Response(renderLogin(), {
					headers: { "content-type": "text/html" },
				});
			}

			if (method === "POST") {
				try {
					const body = await request.json() as { username: string; password: string };
					if (!body.username || !body.password) {
						return new Response(JSON.stringify({ error: "Username and password required" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}
					
					// Check if any users exist
					const userCount = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>();
					
					if (!userCount || userCount.count === 0) {
						// Create first user as admin
						const passwordHash = await hashPassword(body.password);
						const stmt = env.DB.prepare(`
							INSERT INTO users (username, password_hash, is_admin)
							VALUES (?, ?, 1)
						`).bind(body.username, passwordHash);
						await stmt.run();
						
						const newUser = await env.DB.prepare("SELECT id, username FROM users WHERE username = ?")
							.bind(body.username)
							.first<{ id: number; username: string }>();
						
						if (!newUser) {
							return new Response(JSON.stringify({ error: "Failed to create user" }), {
								status: 500,
								headers: { "content-type": "application/json" },
							});
						}

						// Create session
						const sessionId = generateSessionId();
						const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
						await env.DB.prepare(`
							INSERT INTO sessions (id, user_id, expires_at)
							VALUES (?, ?, ?)
						`).bind(sessionId, newUser.id, expiresAt).run();

						return new Response(JSON.stringify({ success: true, message: "User created and logged in" }), {
							headers: {
								"content-type": "application/json",
								"Set-Cookie": setSessionCookie(sessionId),
							},
						});
					}

					// Normal login
					const user = await env.DB.prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
						.bind(body.username)
						.first<{ id: number; username: string; password_hash: string }>();

					if (!user || !(await verifyPassword(body.password, user.password_hash))) {
						return new Response(JSON.stringify({ error: "Invalid credentials" }), {
							status: 401,
							headers: { "content-type": "application/json" },
						});
					}

					// Create session
					const sessionId = generateSessionId();
					const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
					await env.DB.prepare(`
						INSERT INTO sessions (id, user_id, expires_at)
						VALUES (?, ?, ?)
					`).bind(sessionId, user.id, expiresAt).run();

					return new Response(JSON.stringify({ success: true }), {
						headers: {
							"content-type": "application/json",
							"Set-Cookie": setSessionCookie(sessionId),
						},
					});
				} catch (error) {
					console.error("Login error:", error);
					return new Response(JSON.stringify({ error: "Login failed" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}
		}

		// Logout
		if (path === "/api/logout" && method === "POST") {
			const sessionId = getSessionId(request);
			if (sessionId) {
				await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
			}
			return new Response(JSON.stringify({ success: true }), {
				headers: {
					"content-type": "application/json",
					"Set-Cookie": clearSessionCookie(),
				},
			});
		}

		// Check authentication for all other routes
		const auth = await checkAuth(request, env);
		if (!auth) {
			if (path.startsWith("/api/")) {
				return new Response(JSON.stringify({ error: "Unauthorized" }), {
					status: 401,
					headers: { "content-type": "application/json" },
				});
			}
			return Response.redirect(new URL("/login", url), 302);
		}

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
			return new Response(renderHtml(auth.username), {
				headers: { "content-type": "text/html" },
			});
		}

		if (path === "/leads") {
			return new Response(renderLeads(auth.username), {
				headers: { "content-type": "text/html" },
			});
		}

		if (path === "/deals") {
			return new Response(renderDeals(auth.username), {
				headers: { "content-type": "text/html" },
			});
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
