package com.xdsawyer.essor;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;

import java.util.Map;

final class ReminderScheduler {
    private static final String PREFS = "essor_agenda_native";
    private static final String PREFIX = "reminder:";
    private static final String ACTION_REMINDER = "com.xdsawyer.essor.AGENDA_REMINDER";

    private ReminderScheduler() {}

    static void saveAndSchedule(Context context, String id, long triggerAt, long repeatMs, String kind) {
        if (!validId(id) || triggerAt <= 0L) return;
        long safeRepeat = repeatMs > 0L ? repeatMs : 0L;
        String safeKind = validKind(kind) ? kind : "medical";
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(PREFIX + id, triggerAt + "|" + safeRepeat + "|" + safeKind)
                .apply();
        schedule(context, id, triggerAt, safeRepeat, safeKind);
    }

    static void cancel(Context context, String id) {
        if (!validId(id)) return;
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager != null) manager.cancel(pendingIntent(context, id, 0L, "medical"));
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .remove(PREFIX + id)
                .apply();
    }

    static void markOneTimeComplete(Context context, String id) {
        if (!validId(id)) return;
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .remove(PREFIX + id)
                .apply();
    }

    static void rescheduleAll(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        Map<String, ?> entries = preferences.getAll();
        for (Map.Entry<String, ?> entry : entries.entrySet()) {
            if (!entry.getKey().startsWith(PREFIX) || !(entry.getValue() instanceof String)) continue;
            String id = entry.getKey().substring(PREFIX.length());
            StoredReminder reminder = parse((String) entry.getValue());
            if (!validId(id) || reminder == null) continue;

            long trigger = normalizeFuture(reminder.triggerAt, reminder.repeatMs);
            if (trigger <= 0L) {
                markOneTimeComplete(context, id);
                continue;
            }
            if (trigger != reminder.triggerAt) {
                preferences.edit()
                        .putString(PREFIX + id, trigger + "|" + reminder.repeatMs + "|" + reminder.kind)
                        .apply();
            }
            schedule(context, id, trigger, reminder.repeatMs, reminder.kind);
        }
    }

    static boolean canScheduleExact(Context context) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) return false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        return manager.canScheduleExactAlarms();
    }

    private static void schedule(Context context, String id, long triggerAt, long repeatMs, String kind) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) return;

        long trigger = normalizeFuture(triggerAt, repeatMs);
        if (trigger <= 0L) return;
        PendingIntent pendingIntent = pendingIntent(context, id, repeatMs, kind);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (manager.canScheduleExactAlarms()) {
                manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pendingIntent);
            } else {
                manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pendingIntent);
            }
        } else {
            manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pendingIntent);
        }
    }

    private static PendingIntent pendingIntent(Context context, String id, long repeatMs, String kind) {
        Intent intent = new Intent(context, ReminderReceiver.class)
                .setAction(ACTION_REMINDER)
                .setData(Uri.parse("essor://agenda/reminder/" + Uri.encode(id)))
                .putExtra("id", id)
                .putExtra("repeat", repeatMs)
                .putExtra("kind", kind);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, id.hashCode(), intent, flags);
    }

    private static long normalizeFuture(long triggerAt, long repeatMs) {
        long now = System.currentTimeMillis();
        if (triggerAt > now + 1_000L) return triggerAt;
        if (repeatMs <= 0L) return 0L;
        long steps = ((now - triggerAt) / repeatMs) + 1L;
        return triggerAt + Math.max(1L, steps) * repeatMs;
    }

    static boolean validId(String id) {
        return id != null && id.matches("[A-Za-z0-9-]{8,80}");
    }

    static boolean validKind(String kind) {
        return "medication".equals(kind) || "medical".equals(kind) || "sport".equals(kind);
    }

    private static StoredReminder parse(String value) {
        try {
            String[] parts = value.split("\\|", 3);
            if (parts.length != 3) return null;
            long triggerAt = Long.parseLong(parts[0]);
            long repeatMs = Math.max(0L, Long.parseLong(parts[1]));
            String kind = validKind(parts[2]) ? parts[2] : "medical";
            return new StoredReminder(triggerAt, repeatMs, kind);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private static final class StoredReminder {
        final long triggerAt;
        final long repeatMs;
        final String kind;

        StoredReminder(long triggerAt, long repeatMs, String kind) {
            this.triggerAt = triggerAt;
            this.repeatMs = repeatMs;
            this.kind = kind;
        }
    }
}
