from flask import jsonify

def success_response(data=None, message=None, status_code=200):
    """
    Create a standard success response
    
    Args:
        data: Data to return (optional)
        message (str): Success message (optional)
        status_code (int): HTTP status code
        
    Returns:
        Response: Flask response object
    """
    response = {"success": True}
    
    if data is not None:
        response["data"] = data
    
    if message:
        response["message"] = message
        
    return jsonify(response), status_code

def error_response(message, status_code=400, errors=None):
    """
    Create a standard error response
    
    Args:
        message (str): Error message
        status_code (int): HTTP status code
        errors (dict): Detailed validation errors (optional)
        
    Returns:
        Response: Flask response object
    """
    response = {
        "success": False,
        "message": message
    }
    
    if errors:
        response["errors"] = errors
        
    return jsonify(response), status_code

def paginated_response(items, page, total_items, items_per_page):
    """
    Create a paginated response
    
    Args:
        items (list): List of items for current page
        page (int): Current page number (1-based)
        total_items (int): Total number of items across all pages
        items_per_page (int): Number of items per page
        
    Returns:
        dict: Paginated response dictionary
    """
    total_pages = (total_items + items_per_page - 1) // items_per_page
    
    return {
        "items": items,
        "pagination": {
            "page": page,
            "total_pages": total_pages,
            "total_items": total_items,
            "items_per_page": items_per_page,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }