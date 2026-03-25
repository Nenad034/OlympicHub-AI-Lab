const login = 'sol611s';
const password = 'AqC384lF';
const url = 'https://evaluation.solvex.bg/iservice/integrationservice.asmx';

async function test() {
    try {
        const connRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml', 'SOAPAction': '"http://www.megatec.ru/Connect"' },
            body: `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><Connect xmlns="http://www.megatec.ru/"><login>${login}</login><password>${password}</password></Connect></soap:Body></soap:Envelope>`
        });
        const connText = await connRes.text();
        const guid = connText.split('<ConnectResult>')[1].split('</ConnectResult>')[0];
        console.log('GUID:', guid);

        const searchSoap = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SearchHotelServices xmlns="http://www.megatec.ru/">
      <guid>${guid}</guid>
      <request>
        <PageSize>3</PageSize>
        <DateFrom>2026-07-15T00:00:00</DateFrom>
        <DateTo>2026-07-22T00:00:00</DateTo>
        <CityKeys><int>33</int></CityKeys>
        <Pax>2</Pax>
        <QuotaTypes><int>0</int><int>1</int></QuotaTypes>
        <ResultView>1</ResultView>
      </request>
    </SearchHotelServices>
  </soap:Body>
</soap:Envelope>`;

        const searchRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml', 'SOAPAction': '"http://www.megatec.ru/SearchHotelServices"' },
            body: searchSoap
        });
        const searchText = await searchRes.text();
        console.log('Response status:', searchRes.status);
        console.log('Response body:', searchText.substring(0, 1000));
    } catch (e) {
        console.error(e);
    }
}
test();
