import { extractJwt } from "$lib/jwt.service";
import type { RequestEvent } from "@sveltejs/kit";

export async function post({ request }: RequestEvent) {
  try {
    const jwt = await extractJwt(request);

    if (!jwt) {
      return {
        status: 403
      };
    }

    // const deal: Deal = await request.json();
    // deal.owner = new ObjectId(jwt.sub);
    // deal.startDate = deal.startDate.substring(0, 16);
    // const deals = await getDealsCollection();
    // if (deal._id) {
    //   const _id = new ObjectId(deal._id);
    //   delete deal._id;
    //   await deals.updateOne({ _id }, { $set: deal });
    // } else {
    //   await deals.insertOne(deal);
    // }
    // return {
    //   status: 200
    // };
  } catch (error) {
    console.error("Can't post deal:", error);
    return {
      status: 500
    };
  }
}

export async function get({ request, url }: RequestEvent) {
  try {
    const jwt = await extractJwt(request);
    const allDeals = url.searchParams.get("all");

    if (!jwt) {
      return {
        status: 403
      };
    }

    // const dealCollection = await getDealsCollection();
    // const filter = allDeals ? undefined : { owner: new ObjectId(jwt.sub) };
    // const cursor = await dealCollection.find(filter);
    // const deals = await cursor.toArray();
    // deals.forEach((deal) => {
    //   if (Array.isArray(deal.likes)) {
    //     deal.likes = deal.likes.length;
    //   } else {
    //     deal.likes = 0;
    //   }
    // });
    // return {
    //   body: deals
    // };
  } catch (error) {
    console.error("Can't get deals:", error);
    return {
      status: 500
    };
  }
}
