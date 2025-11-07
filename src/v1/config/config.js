const { env } = require("./env");
const logger = require("./logger");

const defaults = {
  DEBUG_MODE: 0,
  VIN_API_KEY: "b9eac597bbcf4a10b7ab438f7e8a2319feb22a6ebafb4322b7f6ec5",
  VIN_API_OWNER: "Test",
  VIN_BASE_URL: "https://Selorg.vineretail.com/RestWS/api/eretail/v1",
  VIN_ORDER_URL: "https://Selorg.vineretail.com/RestWS/api/eretail/v4/order/create",
  SMS_VENDOR_URL:
    "http://login4.spearuc.com/MOBILE_APPS_API/sms_api.php?type=smsquicksend&user=selorgotp&pass=welcome123&sender=EVOLGN&t_id=1707166841244742343&",
  VIN_CACHE_FLAG: 1
};

const withFallback = (key) => {
  const value = env[key];
  if (value !== undefined && value !== null && value !== "") {
    return value;
  }

  if (defaults[key] !== undefined) {
    logger.warn(
      { key },
      `Environment variable ${key} is not set. Falling back to default value.`
    );
    return defaults[key];
  }

  logger.warn({ key }, `Configuration value for ${key} is not defined.`);
  return undefined;
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

module.exports = {
  debugMode: toNumber(withFallback("DEBUG_MODE"), defaults.DEBUG_MODE),
  vinApiKey: withFallback("VIN_API_KEY"),
  smsvendor: withFallback("SMS_VENDOR_URL"),
  _VINApiOwner_: withFallback("VIN_API_OWNER"),
  _VINAPIKEY_: withFallback("VIN_API_KEY"),
  _VINBASEURL_: withFallback("VIN_BASE_URL"),
  _VINORDER_: withFallback("VIN_ORDER_URL"),
  cachedData: toNumber(withFallback("VIN_CACHE_FLAG"), defaults.VIN_CACHE_FLAG)
};
