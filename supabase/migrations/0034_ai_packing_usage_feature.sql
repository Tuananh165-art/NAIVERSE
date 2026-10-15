-- Track the bounded DeepSeek packing checklist feature in ai_usage.
alter table public.ai_usage drop constraint if exists ai_usage_feature_check;
alter table public.ai_usage add constraint ai_usage_feature_check
  check (feature in ('trip_plan','guide','quote_draft','price_compare','weather_safety','route_assist','packing'));
