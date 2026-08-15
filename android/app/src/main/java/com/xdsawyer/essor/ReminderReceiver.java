package com.xdsawyer.essor;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

public class ReminderReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "essor_agenda";

    @Override
    public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra("id");
        long repeatMs = Math.max(0L, intent.getLongExtra("repeat", 0L));
        String kind = intent.getStringExtra("kind");
        if (!ReminderScheduler.validId(id)) return;
        if (!ReminderScheduler.validKind(kind)) kind = "medical";

        showNotification(context, id, kind);

        if (repeatMs > 0L) {
            ReminderScheduler.saveAndSchedule(
                    context,
                    id,
                    System.currentTimeMillis() + repeatMs,
                    repeatMs,
                    kind
            );
        } else {
            ReminderScheduler.markOneTimeComplete(context, id);
        }
    }

    private void showNotification(Context context, String id, String kind) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Agenda ESSOR",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Rappels locaux de l’agenda ESSOR");
            manager.createNotificationChannel(channel);
        }

        Intent openIntent = new Intent(context, LauncherActivity.class)
                .setAction(Intent.ACTION_VIEW)
                .setData(Uri.parse("https://essor-app.fr/?platform=android&agenda=1"))
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                id.hashCode(),
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String title;
        if ("medication".equals(kind)) title = "Rappel ESSOR · prise";
        else if ("sport".equals(kind)) title = "Rappel ESSOR · activité";
        else title = "Rappel ESSOR · rendez-vous";

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(context, CHANNEL_ID)
                : new Notification.Builder(context);
        builder.setSmallIcon(R.drawable.ic_notification_icon)
                .setContentTitle(title)
                .setContentText("Ouvre ESSOR pour voir le détail de ton agenda.")
                .setAutoCancel(true)
                .setContentIntent(contentIntent)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setVisibility(Notification.VISIBILITY_PRIVATE);

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            builder.setPriority(Notification.PRIORITY_HIGH);
        }

        manager.notify(id.hashCode(), builder.build());
    }
}
