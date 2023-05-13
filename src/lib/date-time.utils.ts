import { addMinutes, format, parseISO } from "date-fns";
import formatInTimeZone from "date-fns-tz/formatInTimeZone";
import type { Deal } from "./supabase/public-types";

const DATE_FORMAT = "yyyy-MM-dd";
const DATE_TIME_FORMAT_WITHOUT_TIMEZONE = DATE_FORMAT + "'T'HH:mm";
const DATE_TIME_FORMAT_WITH_TIMEZONE = DATE_TIME_FORMAT_WITHOUT_TIMEZONE + "XXX";

export function getDateTimeAsIsoString(date = new Date(), offsetInMinutes = 0, timezone = "Europe/Berlin"): string {
  const dateWithOffset = addMinutes(date, offsetInMinutes);
  return formatInTimeZone(dateWithOffset, timezone, DATE_TIME_FORMAT_WITHOUT_TIMEZONE);
}

export function getDateAsIsoString(date = new Date(), offsetInMinutes = 0, timezone = "Europe/Berlin"): string {
  const dateWithOffset = addMinutes(date, offsetInMinutes);
  return formatInTimeZone(dateWithOffset, timezone, DATE_FORMAT);
}

export function formatDate(date: string | number, offsetInMinutes = 0, timezone = "Europe/Berlin"): string {
  const dateWithOffset = addMinutes(new Date(date), offsetInMinutes);
  return formatInTimeZone(dateWithOffset, timezone, "dd.MM.yyyy 'um' HH:mm");
}

function addTimezoneOffset(datetime: string): string {
  const date = new Date(datetime);
  const offsetInMinutes = date.getTimezoneOffset();
  const offsetInHours = Math.floor(Math.abs(offsetInMinutes) / 60);
  const offsetInMinutesRemainder = Math.abs(offsetInMinutes) % 60;

  return format(
    date,
    `${DATE_TIME_FORMAT_WITHOUT_TIMEZONE}${offsetInMinutes < 0 ? "+" : "-"}${offsetInHours
      .toString()
      .padStart(2, "0")}:${offsetInMinutesRemainder.toString().padStart(2, "0")}`
  );
}

function removeTimezoneOffset(datetime: string): string {
  const date = parseISO(datetime);
  return format(date, DATE_TIME_FORMAT_WITHOUT_TIMEZONE);
}

export function addTimezoneOffsetToDeal(deal: Deal) {
  deal.start = addTimezoneOffset(deal.start);
}

export function removeTimezoneOffsetFromDeal(deal: Deal) {
  deal.start = removeTimezoneOffset(deal.start);
}

export function getTimeString(datetime: string | Date = new Date(), timezone = "Europe/Berlin"): string {
  return formatInTimeZone(new Date(datetime), timezone, "HH:mm:ss");
}

export function formatDateWithTimeZone(date: Date | string): string {
  return formatInTimeZone(date, "Europe/Berlin", DATE_TIME_FORMAT_WITH_TIMEZONE);
}

export function isBeforeNow(dateTime: string): boolean {
  const date = parseISO(dateTime);
  const now = new Date();
  return date < now;
}
