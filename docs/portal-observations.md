# SWIM portal observations

This document records behavior observed in the authenticated SWIM browser interface. It is supplementary operational evidence, not part of the Appendix 07 API contract.

## Observed selectable aerodromes

The captured portal screen showed 23 selectable ICAO aerodrome location indicators. The airport-name column below is reference information added to make the codes easier to identify; the API request value remains the four-character ICAO indicator.

| ICAO | Airport | Japanese name | Region |
|---|---|---|---|
| `RJCC` | New Chitose Airport | 新千歳空港 | Hokkaido |
| `RJCH` | Hakodate Airport | 函館空港 | Hokkaido |
| `RJSS` | Sendai Airport | 仙台空港 | Tohoku |
| `RJAA` | Narita International Airport | 成田国際空港 | Kanto |
| `RJTT` | Tokyo International Airport (Haneda) | 東京国際空港（羽田空港） | Kanto |
| `RJSN` | Niigata Airport | 新潟空港 | Chubu |
| `RJGG` | Chubu Centrair International Airport | 中部国際空港 | Chubu |
| `RJOO` | Osaka International Airport (Itami) | 大阪国際空港（伊丹空港） | Kinki |
| `RJBB` | Kansai International Airport | 関西国際空港 | Kinki |
| `RJBE` | Kobe Airport | 神戸空港 | Kinki |
| `RJOA` | Hiroshima Airport | 広島空港 | Chugoku |
| `RJOT` | Takamatsu Airport | 高松空港 | Shikoku |
| `RJOM` | Matsuyama Airport | 松山空港 | Shikoku |
| `RJOK` | Kochi Airport (Kochi Ryoma Airport) | 高知空港（高知龍馬空港） | Shikoku |
| `RJFF` | Fukuoka Airport | 福岡空港 | Kyushu |
| `RJFS` | Saga Airport (Kyushu Saga International Airport) | 佐賀空港（九州佐賀国際空港） | Kyushu |
| `RJFU` | Nagasaki Airport | 長崎空港 | Kyushu |
| `RJFT` | Kumamoto Airport (Aso Kumamoto Airport) | 熊本空港（阿蘇くまもと空港） | Kyushu |
| `RJFO` | Oita Airport | 大分空港 | Kyushu |
| `RJFM` | Miyazaki Airport | 宮崎空港 | Kyushu |
| `RJFK` | Kagoshima Airport | 鹿児島空港 | Kyushu |
| `ROAH` | Naha Airport | 那覇空港 | Okinawa |
| `ROIG` | New Ishigaki Airport | 新石垣空港（南ぬ島石垣空港） | Okinawa |

### Interpretation and maintenance

This table must not be treated as a permanent client-side allowlist:

- the ICAO indicators were observed in the authenticated browser UI, not enumerated by Appendix 07;
- the airport names are descriptive labels and are not sent to the API;
- airport names, aliases, service coverage, and portal choices can change independently;
- the service operator may add, remove, or temporarily suppress locations;
- the API documents business error code `4` for a nonexistent or unsupported location;
- the client therefore validates only the four-character ICAO location-indicator form and leaves current service availability to SWIM.

The airport naming was checked against current Ministry of Land, Infrastructure, Transport and Tourism airport information. Where an airport has a widely used nickname or brand name, the statutory or primary airport name is listed first and the nickname is shown in parentheses.

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
- MLIT Tokyo Civil Aviation Bureau, airport and heliport listings
- The authenticated SWIM portal screen captured for this project

The SWIM portal observation remains the source for which ICAO indicators were selectable in the captured screen; the MLIT airport pages are used only to identify and label those indicators.