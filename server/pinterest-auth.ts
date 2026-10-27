import dotenv from "dotenv";
dotenv.config();

export interface PinterestUser {
  username: string;
  profile_image?: string;
  account_type?: string;
  business_name?: string;
}

export function getPinterestAuthUrl(redirectUri: string): { url: string; error?: string } {
  const appId = process.env.PINTEREST_APP_ID || process.env.PINTEREST_CLIENT_ID;
  if (!appId) {
    return {
      url: "",
      error: "PINTEREST_APP_ID is not configured in project secrets.",
    };
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "boards:read,pins:read,user_accounts:read",
  });

  return {
    url: `https://www.pinterest.com/oauth/?${params.toString()}`,
  };
}

export async function exchangePinterestCode(
  code: string,
  redirectUri: string
): Promise<{ accessToken?: string; error?: string }> {
  const appId = process.env.PINTEREST_APP_ID || process.env.PINTEREST_CLIENT_ID;
  const appSecret = process.env.PINTEREST_APP_SECRET || process.env.PINTEREST_CLIENT_SECRET;

  if (!appId || !appSecret) {
    return { error: "PINTEREST_APP_ID or PINTEREST_APP_SECRET is not configured." };
  }

  try {
    const credentials = Buffer.from(`${appId}:${appSecret}`).toString("base64");
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || "Failed to exchange authorization code with Pinterest." };
    }

    return { accessToken: data.access_token };
  } catch (err: any) {
    console.error("Pinterest token exchange error:", err);
    return { error: err.message || "Network error communicating with Pinterest." };
  }
}

export async function fetchPinterestUserProfile(
  accessToken: string
): Promise<{ user?: PinterestUser; error?: string }> {
  try {
    const res = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message || "Failed to fetch Pinterest profile." };
    }

    const data = await res.json();
    return {
      user: {
        username: data.username || "Pinterest User",
        profile_image: data.profile_image,
        account_type: data.account_type,
        business_name: data.business_name,
      },
    };
  } catch (err: any) {
    console.error("Pinterest user_account error:", err);
    return { error: err.message || "Failed to fetch user account from Pinterest." };
  }
}

export async function searchPinterestApiPins(
  accessToken: string,
  query: string
): Promise<any[]> {
  try {
    // Attempt searching or listing pins via Pinterest API v5
    const searchUrl = `https://api.pinterest.com/v5/search/partner/pins?query=${encodeURIComponent(
      query
    )}&page_size=4`;

    const res = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.items || [];
    }

    // Fallback to user pins if search endpoint is restricted to partner tier
    const userPinsRes = await fetch("https://api.pinterest.com/v5/pins?page_size=10", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (userPinsRes.ok) {
      const data = await userPinsRes.json();
      return data.items || [];
    }

    return [];
  } catch (err) {
    console.warn("Pinterest API search error:", err);
    return [];
  }
}
