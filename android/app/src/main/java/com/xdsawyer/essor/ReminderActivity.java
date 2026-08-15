package com.xdsawyer.essor;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.widget.Toast;

public class ReminderActivity extends Activity {
    private static final int REQUEST_NOTIFICATIONS = 4102;
    private static final long DAY_MS = 86_400_000L;
    private static final long WEEK_MS = 604_800_000L;
    private static final long MAX_FUTURE_MS = 10L * 365L * DAY_MS;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handle(getIntent());
    }

    private void handle(Intent intent) {
        Uri data = intent != null ? intent.getData() : null;
        if (data == null || !"essor".equals(data.getScheme()) || !"agenda".equals(data.getHost())) {
            finish();
            return;
        }

        String operation = data.getQueryParameter("op");
        String id = data.getQueryParameter("id");
        if (!ReminderScheduler.validId(id)) {
            finish();
            return;
        }

        if ("cancel".equals(operation)) {
            ReminderScheduler.cancel(this, id);
            Toast.makeText(this, "Rappel ESSOR désactivé", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        if (!"schedule".equals(operation)) {
            finish();
            return;
        }

        try {
            long triggerAt = Long.parseLong(data.getQueryParameter("at"));
            long repeatMs = Long.parseLong(data.getQueryParameter("repeat"));
            String kind = data.getQueryParameter("kind");
            long now = System.currentTimeMillis();

            if (triggerAt <= now || triggerAt > now + MAX_FUTURE_MS) {
                finish();
                return;
            }
            if (!(repeatMs == 0L || repeatMs == DAY_MS || repeatMs == WEEK_MS)) {
                finish();
                return;
            }
            if (!ReminderScheduler.validKind(kind)) kind = "medical";

            ReminderScheduler.saveAndSchedule(this, id, triggerAt, repeatMs, kind);
            requestNotificationPermissionIfNeeded();
        } catch (RuntimeException ignored) {
            finish();
        }
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQUEST_NOTIFICATIONS);
            return;
        }
        requestExactAlarmAccessIfNeeded();
    }

    private void requestExactAlarmAccessIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !ReminderScheduler.canScheduleExact(this)) {
            try {
                Intent settingsIntent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                        .setData(Uri.parse("package:" + getPackageName()));
                startActivity(settingsIntent);
            } catch (ActivityNotFoundException ignored) {
                // Le rappel inexact programmé reste le repli si cet écran n'est pas disponible.
            }
            Toast.makeText(this, "Autorise « Alarmes et rappels » pour un horaire précis", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        ReminderScheduler.rescheduleAll(this);
        Toast.makeText(this, "Rappel ESSOR programmé", Toast.LENGTH_SHORT).show();
        finish();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_NOTIFICATIONS) {
            requestExactAlarmAccessIfNeeded();
        }
    }
}
