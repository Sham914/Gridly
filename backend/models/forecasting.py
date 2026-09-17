from prophet import Prophet
import pandas as pd

def forecast_household(meter_id: str, df: pd.DataFrame, forecast_hours: int = 24):
    """
    Runs Prophet forecasting for a single household.
    
    Args:
        meter_id: the household/meter identifier (e.g. 'BR49')
        df: the full raw dataset (all households), with columns
            x_Timestamp, t_kWh, meter (at minimum)
        forecast_hours: how many hours ahead to forecast
    
    Returns:
        forecast DataFrame with ds, yhat, yhat_lower, yhat_upper
    """
    household = df[df['meter'] == meter_id].copy()
    household = household.rename(columns={'x_Timestamp': 'ds', 't_kWh': 'y'})
    household['ds'] = pd.to_datetime(household['ds'])
    household = household.sort_values('ds')

    hourly = household.resample('H', on='ds')['y'].sum().reset_index()

    model = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=False)
    model.fit(hourly)

    future = model.make_future_dataframe(periods=forecast_hours, freq='H')
    forecast = model.predict(future)

    forecast['yhat'] = forecast['yhat'].clip(lower=0)
    forecast['yhat_lower'] = forecast['yhat_lower'].clip(lower=0)

    return forecast