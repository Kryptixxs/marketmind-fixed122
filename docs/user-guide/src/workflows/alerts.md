# Workflow: Set & Manage Alerts

## Goal

Configure threshold alerts on any field so you're notified when market conditions change.

## Step-by-Step

```
Step 1: ALRT+ GO                → Open Advanced Alerts panel
Step 2: Enter symbol            → e.g. AAPL US Equity
Step 3: Select field            → e.g. PX_LAST
Step 4: Set operator            → > or <
Step 5: Set threshold value     → e.g. 200
Step 6: Click CREATE            → Alert rule is created
Step 7: ALRT GO                 → View all rules + triggered status
Step 8: NOTIF GO                → Notification center for routing
```

## Alert Anatomy

```
ALERT IF <SYMBOL> <FIELD> <OP> <VALUE>
e.g.: ALERT IF AAPL US Equity PX_LAST > 200
```

## Viewing Triggered Alerts

- **ALRT GO** → all rules with triggered/active status
- **System Strip** top bar shows: `⚠ 2 Alerts` when triggered
- **ALRT** count in System Strip is clickable → navigates to ALRT panel

## Alert Routing

`NOTIF GO` → set routing rules (email, webhook, sound, in-panel badge)  
`ROUTE GO` → configure notification routing rules  
`WEBHOOK GO` → configure webhook targets for alert events

## Pitfalls

- Alerts evaluate against **simulated streaming data** — may trigger on SIM fluctuations
- Policy blocks (`ALRT_CREATE`) prevent creation if user role doesn't have permission
- Check `ENT GO` / `COMP GO` if creation is blocked
