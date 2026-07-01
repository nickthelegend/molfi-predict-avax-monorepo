import { QueryClient, keepPreviousData } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Keep the last successful data visible while a query refetches or its key
      // changes, so the UI never blanks out to a "…" placeholder when it already
      // has data. Placeholders only render on the genuine first load (no prior
      // data). Individual queries can override this if they need a hard reset.
      placeholderData: keepPreviousData,
    },
  },
});
