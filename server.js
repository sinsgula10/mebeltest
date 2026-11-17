import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, storefrontRedirect} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';

const STATIC_ASSET_PATH = /^\/(assets|images)\/|^\/favicon\.(ico|svg|png)$/;

/**
 * Export a fetch handler in module format for Oxygen & Cloudflare Workers/Pages.
 */
export default {
  /**
   * @param {Request} request
   * @param {Env & {ASSETS?: {fetch: (req: Request) => Promise<Response>}}} env
   * @param {ExecutionContext} executionContext
   * @return {Promise<Response>}
   */
  async fetch(request, env, executionContext) {
    try {
      const url = new URL(request.url);

      // Serve built static assets via Cloudflare ASSETS binding if routed to worker
      if (env?.ASSETS && STATIC_ASSET_PATH.test(url.pathname)) {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return assetResponse;
        }
      }

      const hydrogenContext = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );

      /**
       * Create a Hydrogen request handler that internally
       * delegates to React Router for routing and rendering.
       */
      const handleRequest = createRequestHandler({
        build: serverBuild,
        mode: globalThis.process?.env?.NODE_ENV || 'production',
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      if (hydrogenContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await hydrogenContext.session.commit(),
        );
      }

      if (response.status === 404) {
        if (env?.ASSETS) {
          const assetFallback = await env.ASSETS.fetch(request);
          if (assetFallback.status !== 404) {
            return assetFallback;
          }
        }

        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        try {
          return await storefrontRedirect({
            request,
            response,
            storefront: hydrogenContext.storefront,
          });
        } catch {
          return response;
        }
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
