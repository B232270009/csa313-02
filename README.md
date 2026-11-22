# Лаборатори 2 — k6-аар гүйцэтгэл хэмжих

`GET http://127.0.0.1:3000/report` дээр тогтмол болон шаталсан ачаалал өгч, хариуны хугацаа, throughput, алдааны хувийг хэмжив. Энэ нь Лаб 3-ын локал API бөгөөд хүсэлт бүрд 200–400 мс-ийн санамсаргүй хүлээлт оруулдаг. Нэг VU давталт бүрд нэг GET хүсэлт илгээж, HTTP 200 эсэхийг шалгаад 1 секунд хүлээнэ.

## Ажиллуулах

Төслийн үндсэн хавтаснаас эхний терминалд API-г асаана.

```powershell
node .\Lab3\server.js
```

Хоёр дахь PowerShell терминалд мөн төслийн үндсэн хавтаснаас эхэлнэ. `--quiet` сонголтоор явцын мөрүүдийг хасаад бүтэн summary болон k6-ийн логийг файлд хадгалсан.

```powershell
$k6Exe = (Get-ChildItem .\.tools\k6 -Filter k6.exe -Recurse).FullName
& $k6Exe version
Set-Location .\Lab2

& $k6Exe run --quiet --no-color --summary-mode full --log-output stdout script.js |
    Set-Content -Encoding UTF8 results/baseline.txt

foreach ($vu in 5, 30, 100) {
    $file = 'results/run-{0:00}vu.txt' -f $vu
    & $k6Exe run --quiet --no-color --summary-mode full --log-output stdout --vus $vu --duration 1m script.js |
        Set-Content -Encoding UTF8 $file
}

& $k6Exe run --quiet --no-color --summary-mode full --log-output stdout -e MODE=stages script.js |
    Set-Content -Encoding UTF8 results/run-stages.txt
```

`k6 version`-ийн гаралт

```text
k6.exe v2.4.0 (commit/dd9395906d, go1.26.11, windows/amd64)
```

## Baseline ба SLO

5 VU-тай 30 секундийн baseline-д 117 хүсэлтээс бүгд HTTP 200 хариу авсан. Дундаж хугацаа 310.25 мс, p90 нь 386.86 мс, p95 нь 402.39 мс, throughput нь 3.744124 хүсэлт/сек байв. [k6 гаралт](results/baseline.txt) · [Summary зураг](results/baseline.png)

Baseline p95-ыг 1.5-аар үржүүлж бүхэл мс рүү дээш тоймлон `p(95)<604` гэж тогтоосон. Энэ нь ачаалал өсөхөд baseline-аас ойролцоогоор 50% хүртэл нэмэгдэх зай үлдээж байгаа ба алдааны хувьд `rate<0.01` буюу 1%-иас бага гэсэн нөхцөл тавьсан.

```powershell
& $k6Exe run --quiet --no-color --summary-mode full --log-output stdout -e P95_LIMIT_MS=604 script.js |
    Set-Content -Encoding UTF8 results/threshold-pass.txt
$LASTEXITCODE

& $k6Exe run --quiet --no-color --summary-mode full --log-output stdout -e P95_LIMIT_MS=50 script.js |
    Set-Content -Encoding UTF8 results/threshold-fail.txt
$LASTEXITCODE
```

## Тогтмол ачааллын хэмжилт

Мөр бүр нь 1 минутын тусдаа ажиллуулалт. Хариуны хугацааг `http_req_duration`, хүсэлтийн тоо ба throughput-ийг `http_reqs`, алдааны хувийг `http_req_failed` мөрөөс авсан.

| VU | Дундаж (мс) | p90 (мс) | p95 (мс) | p99 (мс) | Нийт хүсэлт | Хүсэлт/сек | Алдаа | Гаралт |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 5 | 310.66 | 386.43 | 395.53 | 407.51 | 231 | 3.769826 | 0.00% | [Текст](results/run-05vu.txt) · [Зураг](results/run-05vu.png) |
| 30 | 308.18 | 389.19 | 400.35 | 410.22 | 1388 | 22.654803 | 0.00% | [Текст](results/run-30vu.txt) · [Зураг](results/run-30vu.png) |
| 100 | 305.37 | 386.78 | 396.97 | 406.26 | 4641 | 75.651439 | 0.00% | [Текст](results/run-100vu.txt) · [Зураг](results/run-100vu.png) |

## Шаталсан ачаалал

Эхний 30 секундэд 5 VU, дараагийн 60 секундэд 30 VU, дараагийн 30 секундэд 100 VU хүргээд сүүлийн 30 секундэд 0 VU хүртэл буулгасан. Шаталсан тест бүх хугацааны нийлбэр summary гаргадаг тул түвшин тус бүрийн хүснэгтийг дээрх тогтмол ачааллын гурван ажиллуулалтаас гаргасан.

Нийт 3518 хүсэлт буюу 23.403271 хүсэлт/сек гарсан. Нийлбэр p95 нь 396.89 мс, алдааны хувь 0.00%, дээд ачаалал 100 VU байв. [k6 гаралт](results/run-stages.txt) · [Summary зураг](results/run-stages.png)

## Threshold-ийн үр дүн

Хоёр ажиллуулалт тус бүр 30 VU, 1 минут үргэлжилсэн.

| Туршилт | p95 босго | Хэмжсэн p95 | Алдаа | Exit code | Гаралт |
| --- | ---: | ---: | ---: | ---: | --- |
| PASS | <604 мс | 454.07 мс | 0.00% | 0 | [Текст](results/threshold-pass.txt) · [Зураг](results/threshold-pass.png) |
| FAIL | <50 мс | 398.72 мс | 0.00% | 99 | [Текст](results/threshold-fail.txt) · [Зураг](results/threshold-fail.png) |

## Дүгнэлт

5-аас 100 VU хүртэл ачааллыг өсгөхөд throughput 3.77-оос 75.65 хүсэлт/сек болж, ойролцоогоор 20 дахин нэмэгдсэн. Тогтмол ачааллын гурван хэмжилтэд p95 нь 395.53–400.35 мс-ийн хооронд байлаа. Иймээс туршсан 100 VU хүртэл нэг хэрэглэгчийн хүлээлт тогтвортой муудаж эхэлсэн цэг ажиглагдсангүй. Энэ туршилтад throughput өссөн ч latency бараг тогтвортой байсан нь хоёр хэмжүүрийг хамтад нь харах хэрэгтэйг харуулсан. Гурван хэмжилтэд бүх хүсэлт HTTP 200 хариу авсан бөгөөд хэмжсэн хүсэлтийн алдааны хувь 0.00% байв. Шаталсан тестийн p95 396.89 мс гарсан бөгөөд энэ нь өсөлт, оргил, буултын үеийг хамарсан нийлбэр утга юм. Baseline-аас гаргасан 604 мс-ийн SLO-г 30 VU-тай туршихад p95 454.07 мс, алдааны хувь 0.00% гарч, хоёр нөхцөл хангагдсан. Босгыг 50 мс болгоход HTTP алдаа гараагүй ч p95 нөхцөл зөрчигдөж, k6 exit code 99 буцаасан. Энэ нь CI дээр HTTP хүсэлтүүд амжилттай байсан ч latency-ийн SLO зөрчигдвөл тестийг автоматаар FAIL гэж тэмдэглэх боломжтойг харуулсан.
# csa313-02
