# SWIM portal observations

This document records behavior observed in the authenticated SWIM browser interface. It is supplementary operational evidence, not part of the Appendix 07 API contract.

## Observed selectable aerodromes

The portal screen showed the following ICAO aerodrome location indicators:

| | | |
|---|---|---|
| RJCC | RJCH | RJSS |
| RJAA | RJTT | RJSN |
| RJGG | RJOO | RJBB |
| RJBE | RJOA | RJOT |
| RJOM | RJOK | RJFF |
| RJFS | RJFU | RJFT |
| RJFO | RJFM | RJFK |
| ROAH | ROIG | |

There were 23 selectable locations in the captured portal screen.

This list must not be treated as a permanent client-side allowlist:

- it comes from the browser UI, not from the Appendix 07 API specification;
- the service operator may add, remove, or temporarily suppress locations;
- the API documents business error code `4` for a nonexistent or unsupported location;
- the client therefore validates only the four-character ICAO location-indicator form and leaves service availability to SWIM.

## Observed result presentation

A portal query for `RJCH` with multiple display items showed successive complete ATIS messages, including information identifiers `H`, `G`, and `F`.

The visible message structure included:

```text
ATIS RJCH H
M0500
(APCH)ILS Z RWY12
USING RWY 12
SHIRAKAMI APP FREQ 120.85
M
020500Z 14014KT 40KM FEW020CU SCT030CU
23/17 Q1011/A2988=
Q/TWO NINE EIGHT EIGHT
```

The following older entries were shown below it with identifiers `G` and `F`. This supports these implementation decisions:

- `dispcnt` represents the number of ATIS messages requested per location;
- `atisinfo` is an ordered array of complete ATIS text entries;
- each entry can contain approach, runway, frequency, operational, and meteorological information;
- the embedded meteorological observation does not turn the entire entry into a standalone METAR product;
- the library preserves each returned string without attempting semantic parsing.

## Timestamp caution

The portal displayed a "last updated" value independently of the ATIS message text. Appendix 07 does not define that browser-page presentation field as part of the API response, so this library does not model it.
