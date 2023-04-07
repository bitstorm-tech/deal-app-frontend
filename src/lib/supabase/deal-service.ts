import type { DealFilter } from "$lib/database/deal/deal.model";
import dateTimeUtils from "$lib/date-time.utils";
import storageService from "$lib/supabase/storage-service";
import omit from "lodash/omit";
import locationService from "./location-service";
import type { ActiveDeal, Deal, GetActiveDealsWithinExtentFunctionArguments } from "./public-types";
import { getUserId, supabase } from "./supabase-client";

async function getDeal(id: string): Promise<Deal | undefined> {
  const { data, error } = await supabase.from("deals").select().eq("id", id).single();

  if (error) {
    console.error("Can't get deal:", error);
    return;
  }

  const deal: Deal = data;

  if (!deal.imageUrls) {
    deal.imageUrls = [];
  }

  return deal;
}

async function getActiveDealsByDealer(dealerIds: string | string[]): Promise<ActiveDeal[]> {
  const ids = Array.isArray(dealerIds) ? dealerIds : [dealerIds];
  const { data, error } = await supabase.from("active_deals_view").select().in("dealer_id", ids);

  if (error) {
    console.error("Can't get active deals:", error);
    return [];
  }

  return enrichDealWithImageUrls(data);
}

async function upsertDeal(deal: Deal, alsoCreateTemplate = false): Promise<string | undefined> {
  dateTimeUtils.addTimezoneOffsetToDeal(deal);
  const _deal = deal.id === "" ? omit(deal, "id") : deal;
  delete _deal.imageUrls;

  const resultUpsertDeal = await supabase.from("deals").upsert(_deal).select("id").single();

  if (resultUpsertDeal.error) {
    console.log("Can't upsert deal:", resultUpsertDeal.error);
    return;
  }

  if (!alsoCreateTemplate) {
    return resultUpsertDeal.data.id;
  }

  deal.template = true;
  const resultUpsertTemplate = await supabase.from("deals").insert(deal).select("id").single();

  if (resultUpsertTemplate.error) {
    console.log("Can't insert deal template:", resultUpsertTemplate.error);
    return resultUpsertDeal.data.id;
  }

  return resultUpsertTemplate.data.id;
}

async function deleteDeal(dealId: string): Promise<string | undefined> {
  const dealerId = await getUserId();
  const { error } = await supabase.from("deals").delete().eq("id", dealId).eq("dealer_id", dealerId);

  if (error) {
    console.log("Can't delete deal:", error);
    return error.message;
  }
}

function createExtentFromFilter(filter: DealFilter): GetActiveDealsWithinExtentFunctionArguments | null {
  if (filter.extent) {
    return { p_extent: filter.extent };
  }

  if (filter.radius && filter.location) {
    return {
      p_location: [filter.location.longitude, filter.location.latitude],
      p_radius: filter.radius
    };
  }

  return null;
}

export async function getDealsByFilter(filter: DealFilter): Promise<ActiveDeal[]> {
  const extent = createExtentFromFilter(filter);

  if (!extent) {
    console.log("Can't get deals by filter -> no valid extent");
    return [];
  }

  let query = supabase.rpc("get_active_deals_within_extent", extent);
  // let query = supabase.from("active_deals_view").select();

  if (filter.categoryIds && filter.categoryIds.length > 0) {
    query = query.in("category_id", filter.categoryIds);
  }

  if (filter.limit) {
    query = query.limit(filter.limit);
  }

  if (filter.order) {
    query = query.order(filter.order.column, { ascending: filter.order.ascending });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Can't get deals by filter:", error);
    return [];
  }

  return enrichDealWithImageUrls(data);
}

async function getDealsByDealerId(dealerId: string, activeOnly = true): Promise<ActiveDeal[] | Deal[]> {
  const query = activeOnly
    ? supabase.from("active_deals_view").select().eq("dealer_id", dealerId)
    : supabase.from("deals").select().eq("dealer_id", dealerId).eq("template", false);
  const { data, error } = await query;

  if (error) {
    console.error("Can't get deals by dealer id:", error);
    return [];
  }

  return enrichDealWithImageUrls(data);
}

async function toggleHotDeal(dealId: string): Promise<ActiveDeal | null> {
  const { data } = await supabase.from("hot_deals").select().eq("deal_id", dealId);

  if (data && data.length >= 1) {
    await supabase.from("hot_deals").delete().eq("deal_id", dealId);
    return null;
  }

  const userId = await getUserId();
  if (!userId) {
    console.log("Can't toggle hot deal, unknown user");
    return null;
  }
  await supabase.from("hot_deals").insert({ user_id: userId, deal_id: dealId });
  const result = await supabase.from("active_deals_view").select().eq("id", dealId).single();

  if (result.error) {
    console.log("Can't get hot deal:", result.error);
    return null;
  }

  return result.data;
}

async function getTopDeals(limit: number): Promise<ActiveDeal[]> {
  const filter = await locationService.createFilterByCurrentLocationAndSelectedCategories();
  filter.limit = limit;

  return await getDealsByFilter(filter);
}

async function getHotDeals(): Promise<ActiveDeal[]> {
  const userId = await getUserId();
  const hotDealsResult = await supabase.from("hot_deals").select().eq("user_id", userId);

  if (hotDealsResult.error) {
    console.log("Can't get hot deals:", hotDealsResult.error);
    return [];
  }

  const activeDealsResult = await supabase
    .from("active_deals_view")
    .select()
    .in(
      "id",
      hotDealsResult.data.map((hot) => hot.deal_id)
    );

  if (activeDealsResult.error) {
    console.log("Can't get hot deals:", activeDealsResult.error);
    return [];
  }

  return enrichDealWithImageUrls(activeDealsResult.data);
}

async function enrichDealWithImageUrls(deals: ActiveDeal[] | Deal[]): Promise<ActiveDeal[] | Deal[]> {
  for (const deal of deals) {
    if (!deal.id || !deal.dealer_id) {
      console.log("Can't enrich deal with image URLs -> either deal or dealer ID unknown");
      continue;
    }
    deal.imageUrls = await storageService.getDealImages(deal.id, deal.dealer_id);
  }

  return deals;
}

export default {
  deleteDeal,
  getActiveDealsByDealer,
  getDeal,
  getDealsByDealerId,
  getDealsByFilter,
  getHotDeals,
  getTopDeals,
  toggleHotDeal,
  upsertDeal
};
