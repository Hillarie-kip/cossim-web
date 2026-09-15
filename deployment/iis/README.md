# IIS / iisnode deployment

This configuration is a proposed replacement for the supplied web.config. It
has not been tested on the live IIS server. The confirmed failure is HTTP 500
for a JavaScript chunk referenced by the current /admin/packages HTML; the IIS
substatus and Node log are still needed to establish the root cause.

## Before deployment

1. Back up the current web.config and retain the previous complete release.
2. Review the existing server.js. It must pass every request (including
   /_next/static/*) to Next.js's getRequestHandler(), await app.prepare(), and
   listen on process.env.PORT. Under iisnode PORT can be a named pipe: do not
   parse it as an integer or replace it with port 8017.
3. Preserve any required production environment settings outside this template.
   No secrets are included. If NextAuth is actually used by the deployed server,
   its URL must be https://collect.cossim.co.ke; replace the pasted secret if it
   is the active production secret. The checked-in application does not import
   NextAuth.
4. Run npm ci and npm run build in a separate release directory. Deploy only
   after a successful build. Do not build over the running site's .next folder.
5. Keep .next/server, .next/static, .next/BUILD_ID, manifests, public, configuration,
   server.js, and installed runtime dependencies from the same release. This
   template assumes a normal Next.js build, not a standalone output server.

## Apply and verify

Copy web.config from this directory beside the existing server.js in the IIS
application root. Confirm the Node executable path and application-pool access
to application files and the iisnode log directory. Switch to the complete
release and recycle the site's application pool during the deployment window.
Retain old static assets if older browser sessions still reference them.

Verify /admin/packages and every JavaScript URL referenced by its HTML.
JavaScript files must return 200 with a JavaScript content type. If any still
return 500, capture the IIS sc-status, sc-substatus, sc-win32-status and matching
iisnode log entry. Compare the failing URL with the corresponding file under
.next/static/chunks in the active release. A reload cannot repair missing files.

## Configuration changes

- Explicit catch-all regular expression `.*`, with query strings preserved.
- Every application request goes through Next.js; no physical-file bypass that
  could expose application source files.
- No duplicate PNG/SVG MIME additions.
- Server-side logging retained; browser debug/error detail disabled.
- Next.js responses pass through IIS without replacement error pages.

References:
- https://github.com/projectkudu/kudu/wiki/Using-a-custom-web.config-for-Node-apps
- https://learn.microsoft.com/en-us/troubleshoot/developer/webapps/iis/site-behavior-performance/http-error-500-19-webpage
- https://nextjs.org/docs/app/guides/custom-server
