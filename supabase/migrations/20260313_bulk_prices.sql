-- Bulk Update Prices Function
-- Handles mass updates for net prices or margins

CREATE OR REPLACE FUNCTION bulk_update_prices(
    p_supplier_id UUID DEFAULT NULL,
    p_hotel_id UUID DEFAULT NULL,
    p_target TEXT DEFAULT 'net_price', -- 'net_price' or 'margin_percent'
    p_value_type TEXT DEFAULT 'percent', -- 'percent' or 'fixed'
    p_value NUMERIC DEFAULT 0,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- This function performs the update on price_periods
    -- It relies on trg_calculate_period_profitability to fix Gross prices automatically
    
    UPDATE price_periods pp
    SET 
        net_price = CASE 
            WHEN p_target = 'net_price' THEN 
                CASE 
                    WHEN p_value_type = 'percent' THEN pp.net_price * (1 + p_value / 100)
                    ELSE pp.net_price + p_value
                END
            ELSE pp.net_price
        END,
        margin_percent = CASE 
            WHEN p_target = 'margin_percent' THEN 
                CASE 
                    WHEN p_value_type = 'percent' THEN pp.margin_percent * (1 + p_value / 100)
                    ELSE pp.margin_percent + p_value
                END
            ELSE pp.margin_percent
        END
    FROM pricelists pl
    WHERE pp.pricelist_id = pl.id
      AND (p_supplier_id IS NULL OR pl.supplier_id = p_supplier_id)
      AND (p_hotel_id IS NULL OR pl.property_id = p_hotel_id)
      AND (p_date_from IS NULL OR pp.date_from >= p_date_from)
      AND (p_date_to IS NULL OR pp.date_to <= p_date_to);
      
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
