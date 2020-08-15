---
title: Bonjour Discovery Across Subnets
tags:
  - blog
emoji: ""
link: ""
date: "2020-08-15"
---

In home automation, bonjour services can make one's life extremely simple. Plug your device in, connect it to your network and load up your favorite home automation application, and poof! You have access to it automatically!

This is the best case scenario, but there are times where you can't necessarily connect the device directly to your network. This could be due to wanting added security between smart home devices and other networked devices (separate VLANs/subnets) or you don't actually manage the device (a thermostat installed by your landlord). For these reasons, auto discovery may not be possible. This leaves you with the inability to benefit from automated setup and could prevent you from using said device.

Maybe the platform you're using allows you to connect to the device directly over IP, but sometimes this is more of a headache than warranted. Instead, you could use a tool to share bonjour broadcasts between separate networks. That's where [bonjourproxy](https://github.com/antoniomika/bonjourproxy) comes in.

bonjourproxy is a small tool that allows you to broadcast the relevant information required for autodiscovery to your separate network. It can be setup to broadcast any number of devices and can be configured for the type of information to broadcast.

For example, let's say you have a smart thermostat on a separate network but you want it to be discoverable by something like [Home Assistant](https://www.home-assistant.io/) that exists on your main network. You can setup a service using a config like so:

```toml
[[proxyservice]]
name = "ecobee"
servicetype = "_hap._tcp"
domain = ""
port = 1200
host = "ecobee"
ip = "192.168.0.1"
textdata = [
    "MFG=ecobee Inc."
]
```

which broadcasts the relevant Bonjour service to be discovered. The beauty of this system is it can be setup on any linux/mac device and can be used from a single multi-arch docker image. Meaning you can easily run it with something like:

```bash
docker run -itd \
    --restart=always \
    --net=host \
    --name=bonjourproxy \
    -v /mnt/data/supervisor/share/bonjourproxy/services.toml:/app/services.toml:ro \
    antoniomika/bonjourproxy:latest
```

If you're using Home Assistant, there are some changes that you may need to make in order for this to work. Namely, these changes add retry logic to the pairing mechanism.

Here's a diff of the changes I introduced using a custom component:

```diff
--- a/homeassistant/components/homekit_controller/config_flow.py
+++ b/config/custom_components/homekit_controller/config_flow.py
@@ -313,6 +313,7 @@ class HomekitControllerFlowHandler(config_entries.ConfigFlow):
         # volatile. We do cache it, but not against the config entry.
         # So copy the pairing data and mutate the copy.
         pairing_data = pairing.pairing_data.copy()
+        _LOGGER.debug(pairing_data)

         # Use the accessories data from the pairing operation if it is
         # available. Otherwise request a fresh copy from the API.
@@ -320,9 +321,19 @@ class HomekitControllerFlowHandler(config_entries.ConfigFlow):
         # the same time.
         accessories = pairing_data.pop("accessories", None)
         if not accessories:
-            accessories = await pairing.list_accessories_and_characteristics()
+            _LOGGER.debug("Attempting to load accessories and characteristics")
+            while True:
+                try:
+                    accessories = await pairing.list_accessories_and_characteristics()
+                except Exception:
+                    _LOGGER.exception("Handled exception and retrying")
+                    continue
+                break

         bridge_info = get_bridge_information(accessories)
         name = get_accessory_name(bridge_info)

+        _LOGGER.debug(bridge_info)
+        _LOGGER.debug(name)
+
         return self.async_create_entry(title=name, data=pairing_data)
diff --git a/homeassistant/components/homekit_controller/connection.py b/config/custom_components/homekit_controller/connection.py
index 9d8eb00b54..61626310d4 100644
--- a/homeassistant/components/homekit_controller/connection.py
+++ b/config/custom_components/homekit_controller/connection.py
@@ -140,7 +140,12 @@ class HKDevice:

     async def async_setup(self):
         """Prepare to use a paired HomeKit device in Home Assistant."""
+        _LOGGER.debug(self)
+
         cache = self.hass.data[ENTITY_MAP].get_map(self.unique_id)
+
+        _LOGGER.debug(cache)
+
         if not cache:
             if await self.async_refresh_entity_map(self.config_num):
                 self._polling_interval_remover = async_track_time_interval(
@@ -152,6 +157,8 @@ class HKDevice:
         self.accessories = cache["accessories"]
         self.config_num = cache["config_num"]

+        _LOGGER.debug(cache)
+
         self.entity_map = Accessories.from_list(self.accessories)

         self._polling_interval_remover = async_track_time_interval(
@@ -208,7 +215,13 @@ class HKDevice:
     async def async_refresh_entity_map(self, config_num):
         """Handle setup of a HomeKit accessory."""
         try:
-            self.accessories = await self.pairing.list_accessories_and_characteristics()
+            while True:
+                try:
+                    self.accessories = await self.pairing.list_accessories_and_characteristics()
+                except Exception:
+                    _LOGGER.exception("Setting up the accessory")
+                    continue
+                break
         except AccessoryDisconnectedError:
             # If we fail to refresh this data then we will naturally retry
             # later when Bonjour spots c# is still not up to date.
```
