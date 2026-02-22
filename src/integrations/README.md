# ClickToTravel Integrations Architecture

This directory contains all external API integrations, organized by provider. 
This structure follows the **Feature-based Arhitecture** (Step 1 of Stability Principles).

## Structure
Each provider has its own folder containing:
- `api/`: Direct API clients, SOAP/REST request logic, and service adapters.
- `types/`: TypeScript interfaces and types specific to the provider's API.
- `mappers/`: (Optional) Logic for mapping provider-specific data to our unified models.
- `docs/`: Technical documentation, WSDL files, example XML/JSON responses, and integration guides.

## Providers
- `solvex/`: Main Bulgarian provider (SOAP).
- `opengreece/`: Greek hotels & activities (XML/OTA).
- `mars/`: Content & Price calculation.
- `ors/`: Search & Booking services.
- `tct/`: Internal/Main API connection.
- `amadeus/`: Flight search and booking API.
- `kyte/`: Direct Air Connect API.
- `filos/`: Greek destination management (XML).

## Rules
1. **Isolation**: No provider folder should depend on another provider's internal API folder.
2. **Secrets**: NEVER store credentials in these folders. Use `.env` or Supabase Secrets.
3. **Mappers**: Always try to map external data to our unified `Hotel`, `Room`, and `Booking` interfaces.
4. **Docs**: Keep the `docs/` folder updated with any new API changes or discovered XML structures.

---
*Maintained by ClickToTravel Architecture Team*
