# SWIM portal observations

This document records behavior observed in the authenticated SWIM browser interface. It is supplementary operational evidence, not part of the Appendix 07 API contract.

## Observed selectable aerodromes

The captured portal screen showed 23 selectable ICAO aerodrome location indicators. The airport-name and link columns below are reference information added to make the codes easier to identify; the API request value remains the four-character ICAO indicator.

| ICAO | IATA | Airport | Japanese name | Region | Official website | Flightradar24 |
|---|---|---|---|---|---|---|
| `RJCC` | `CTS` | New Chitose Airport | 新千歳空港 | Hokkaido | [Official](https://www.new-chitose-airport.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/cts) |
| `RJCH` | `HKD` | Hakodate Airport | 函館空港 | Hokkaido | [Official](https://www.hakodate-airport.co.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/hkd) |
| `RJSS` | `SDJ` | Sendai Airport | 仙台空港 | Tohoku | [Official](https://www.sendai-airport.co.jp/global/) | [FR24](https://www.flightradar24.com/data/airports/sdj) |
| `RJAA` | `NRT` | Narita International Airport | 成田国際空港 | Kanto | [Official](https://www.narita-airport.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/nrt) |
| `RJTT` | `HND` | Tokyo International Airport (Haneda) | 東京国際空港（羽田空港） | Kanto | [Official](https://tokyo-haneda.com/en/) | [FR24](https://www.flightradar24.com/data/airports/hnd) |
| `RJSN` | `KIJ` | Niigata Airport | 新潟空港 | Chubu | [Official](https://www.niigata-airport.gr.jp/?lang=en) | [FR24](https://www.flightradar24.com/data/airports/kij) |
| `RJGG` | `NGO` | Chubu Centrair International Airport | 中部国際空港 | Chubu | [Official](https://www.centrair.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/ngo) |
| `RJOO` | `ITM` | Osaka International Airport (Itami) | 大阪国際空港（伊丹空港） | Kinki | [Official](https://www.osaka-airport.co.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/itm) |
| `RJBB` | `KIX` | Kansai International Airport | 関西国際空港 | Kinki | [Official](https://www.kansai-airport.or.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/kix) |
| `RJBE` | `UKB` | Kobe Airport | 神戸空港 | Kinki | [Official](https://www.kairport.co.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/ukb) |
| `RJOA` | `HIJ` | Hiroshima Airport | 広島空港 | Chugoku | [Official](https://www.hij.airport.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/hij) |
| `RJOT` | `TAK` | Takamatsu Airport | 高松空港 | Shikoku | [Official](https://www.takamatsu-airport.com/en/) | [FR24](https://www.flightradar24.com/data/airports/tak) |
| `RJOM` | `MYJ` | Matsuyama Airport | 松山空港 | Shikoku | [Official](https://www.matsuyama-airport.co.jp/) | [FR24](https://www.flightradar24.com/data/airports/myj) |
| `RJOK` | `KCZ` | Kochi Airport (Kochi Ryoma Airport) | 高知空港（高知龍馬空港） | Shikoku | [Official](https://www.kochiap.co.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/kcz) |
| `RJFF` | `FUK` | Fukuoka Airport | 福岡空港 | Kyushu | [Official](https://www.fukuoka-airport.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/fuk) |
| `RJFS` | `HSG` | Saga Airport (Kyushu Saga International Airport) | 佐賀空港（九州佐賀国際空港） | Kyushu | [Official](https://saga-ab.jp/) | [FR24](https://www.flightradar24.com/data/airports/hsg) |
| `RJFU` | `NGS` | Nagasaki Airport | 長崎空港 | Kyushu | [Official](https://www.nagasaki-airport.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/ngs) |
| `RJFT` | `KMJ` | Kumamoto Airport (Aso Kumamoto Airport) | 熊本空港（阿蘇くまもと空港） | Kyushu | [Official](https://www.kumamoto-airport.co.jp/) | [FR24](https://www.flightradar24.com/data/airports/kmj) |
| `RJFO` | `OIT` | Oita Airport | 大分空港 | Kyushu | [Official](https://www.oita-airport.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/oit) |
| `RJFM` | `KMI` | Miyazaki Airport | 宮崎空港 | Kyushu | [Official](https://www.miyazaki-airport.co.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/kmi) |
| `RJFK` | `KOJ` | Kagoshima Airport | 鹿児島空港 | Kyushu | [Official](https://www.koj-ab.co.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/koj) |
| `ROAH` | `OKA` | Naha Airport | 那覇空港 | Okinawa | [Official](https://www.naha-airport.co.jp/en/) | [FR24](https://www.flightradar24.com/data/airports/oka) |
| `ROIG` | `ISG` | New Ishigaki Airport | 新石垣空港（南ぬ島石垣空港） | Okinawa | [Official](https://www.ishigaki-airport.co.jp/) | [FR24](https://www.flightradar24.com/data/airports/isg) |

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
