from playwright.sync_api import sync_playwright

def verify_job_invite_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We need to simulate the environment where the app is running
        # The app is running on localhost:3000
        # However, we don't have a real backend with tokens in the 'job_tokens' table accessible from here easily
        # because we are mocking everything in unit tests and using Supabase in real app.
        # But wait, we can't easily seed the database from here without running backend scripts.
        # And we mocked the repository in unit tests, but in the real browser, the app will try to call the real Supabase Edge Function.

        # Since we cannot easily spin up the full Supabase Edge Function environment accessible to the frontend
        # running in `npm run dev` (which points to 127.0.0.1:54321 usually), AND we haven't seeded data...

        # ACTUALLY: We can intercept network requests with Playwright!
        # This allows us to mock the backend response at the browser level,
        # enabling us to verify the Frontend UI without a running backend.

        page = browser.new_page()

        # Intercept the Edge Function call for get-job-by-token
        # The URL will likely be something like '**/functions/v1/get-job-by-token'

        def handle_get_job(route):
            print("Intercepted get-job-by-token")
            route.fulfill(
                status=200,
                content_type="application/json",
                body='''{
                    "job": {
                        "title": "Fix Leaky Faucet",
                        "description": "The kitchen faucet is dripping constantly.",
                        "service_date": "2023-11-20",
                        "client_name": "Alice Johnson",
                        "property_address": {
                            "address_line1": "456 Maple Ave",
                            "city": "Toronto",
                            "province": "ON",
                            "postal_code": "M4B 1B3"
                        },
                        "status": "sent"
                    },
                    "contractor": {
                        "business_name": "Mario Plumbing",
                        "full_name": "Mario Rossi",
                        "email": "mario@example.com"
                    }
                }'''
            )

        # Intercept the Edge Function call for respond-to-job-invite (optional for this visual check)
        def handle_respond(route):
             print("Intercepted respond-to-job-invite")
             route.fulfill(
                status=200,
                content_type="application/json",
                body='{"success": true, "newStatus": "approved"}'
             )

        page.route("**/functions/v1/get-job-by-token", handle_get_job)
        page.route("**/functions/v1/respond-to-job-invite", handle_respond)

        # Navigate to a fake token URL
        print("Navigating to job invite page...")
        page.goto("http://localhost:3000/job-invite/fake-token-123")

        # Wait for content to load
        try:
            page.wait_for_selector("text=Fix Leaky Faucet", timeout=10000)
            print("Page loaded successfully.")
        except Exception as e:
            print(f"Page load failed or timed out: {e}")
            # Take screenshot anyway to see what happened
            page.screenshot(path="verification/verification_failed.png")
            browser.close()
            return

        # Take a screenshot of the initial view
        page.screenshot(path="verification/verification_job_invite.png")
        print("Screenshot taken: verification/verification_job_invite.png")

        browser.close()

if __name__ == "__main__":
    verify_job_invite_page()
