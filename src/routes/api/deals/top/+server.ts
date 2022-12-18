import type { DealFilter } from "$lib/database/deal/deal.model";
import { findDealsByFilter } from "$lib/database/deal/deal.service";
import { errorResponse, response, unauthorizedResponse } from "$lib/http.utils";
import { extractJwt } from "$lib/jwt.utils";
import { getImageUrls } from "$lib/s3.utils";
import type { RequestEvent } from "@sveltejs/kit";

export async function POST({ request }: RequestEvent) {
  try {
    const jwt = await extractJwt(request);

    if (!jwt || !jwt.sub) {
      return unauthorizedResponse();
    }

    const filter: DealFilter = await request.json();
    filter.limit = Math.min((filter.limit as number) || 10, 100);
    filter.orderBy = "likes DESC";

    const deals = await findDealsByFilter(filter);

    for (const deal of deals) {
      deal.imageUrls = await getImageUrls(deal.dealer_id, deal.id);
    }

    return response(deals);
  } catch (error) {
    console.error("Can't post deal:", error);
    return errorResponse();
  }
}
