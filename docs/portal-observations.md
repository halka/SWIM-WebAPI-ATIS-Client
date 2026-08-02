# SWIM portal observations

This document records behavior observed in the authenticated SWIM browser interface. It is supplementary operational evidence, not part of the Appendix 07 API contract.

## Observed selectable aerodromes

The captured portal screen showed 23 selectable ICAO aerodrome location indicators. The airport-name and link columns below are reference information added to make the codes easier to identify; the API request value remains the four-character ICAO indicator.

| ICAO | Airport |Official website | Flightradar24 |
|---|---|---|---|
| `RJCC` | New Chitose | [Official](https://www.hokkaido-airports.com/en/new-chitose/) | [FR24](https://www.flightradar24.com/data/airports/cts) |
| `RJCH` | Hakodate | [Official](https://www.hokkaido-airports.com/en/hakodate/) | [FR24](https://www.flightradar24.com/data/airports/hkd) |
| `RJSS` | Sendai | [Official](https://www.sendai-airport.co.jp/global/) | [FR24](https://www.flightradar24.com/data/airports/sdj) |
| `RJAA` | Narita (Tokyo Wide Area) | [Official](https://www.narita-airport.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/nrt) |
| `RJTT` | Haneda (Tokyo Metropolitan) | [Official](https://tokyo-haneda.com/en/) | [FR24](https://www.flightradar24.com/data/airports/hnd) |
| `RJSN` | Niigata | [Official](https://www.niigata-airport.gr.jp/?lang=en) | [FR24](https://www.flightradar24.com/data/airports/kij) |
| `RJGG` | Chubu Centrair (Nagoya)| [Official](https://www.centrair.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/ngo) |
| `RJOO` | Itami (Osaka) | [Official](https://www.osaka-airport.co.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/itm) |
| `RJBB` | Kansai (Osaka) | [Official](https://www.kansai-airport.or.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/kix) |
| `RJBE` | Kobe | [Official](https://www.kairport.co.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/ukb) |
| `RJOA` | Hiroshima | [Official](https://www.hij.airport.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/hij) |
| `RJOT` | Takamatsu | [Official](https://www.takamatsu-airport.com/) | [FR24](https://www.flightradar24.com/data/airports/tak) |
| `RJOM` | Matsuyama | [Official](https://www.matsuyama-airport.co.jp/) | [FR24](https://www.flightradar24.com/data/airports/myj) |
| `RJOK` | Kochi | [Official](https://www.kochiap.co.jp/) | [FR24](https://www.flightradar24.com/data/airports/kcz) |
| `RJFF` | Fukuoka | [Official](https://www.fukuoka-airport.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/fuk) |
| `RJFS` | Saga | [Official](https://saga-ab.jp/) | [FR24](https://www.flightradar24.com/data/airports/hsg) |
| `RJFU` | Nagasaki | [Official](https://www.nagasaki-airport.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/ngs) |
| `RJFT` | Kumamoto | [Official](https://www.kumamoto-airport.co.jp/) | [FR24](https://www.flightradar24.com/data/airports/kmj) |
| `RJFO` | Oita Airport | [Official](https://www.oita-airport.jp/) | [FR24](https://www.flightradar24.com/data/airports/oit) |
| `RJFM` | Miyazaki | [Official](https://www.miyazaki-airport.co.jp/) | [FR24](https://www.flightradar24.com/data/airports/kmi) |
| `RJFK` | Kagoshima | [Official](https://www.koj-ab.co.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/koj) |
| `ROAH` | Naha | [Official](https://www.naha-airport.co.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/oka) |
| `ROIG` | Ishigaki | [Official](https://www.ishigaki-airport.co.jp/) | [FR24](https://www.flightradar24.com/data/airports/isg) |

### Interpretation and maintenance

This table must not be treated as a permanent client-side allowlist:

- the ICAO indicators were observed in the authenticated browser UI, not enumerated by Appendix 07;
- IATA codes, airport names, and links are descriptive metadata and are not sent to the API;
- airport names, aliases, websites, service coverage, and portal choices can change independently;
- Flightradar24 is a third-party service and its URLs or availability may change;
- the service operator may add, remove, or temporarily suppress locations;
- the API documents business error code `4` for a nonexistent or unsupported location;
- the client therefore validates only the four-character ICAO location-indicator form and leaves current service availability to SWIM.

The airport naming and official-site links were checked against current airport operator and Ministry of Land, Infrastructure, Transport and Tourism information. Where an airport has a widely used nickname or brand name, the statutory or primary airport name is listed first and the nickname is shown in parentheses.

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

## Reference sources

- MLIT Civil Aviation Bureau, airport list and regional airport information
- Official websites operated by each airport or airport operator
- Flightradar24 airport information pages (third-party operational reference)
