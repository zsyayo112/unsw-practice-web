def sum_to_n(n):
    if n <= 0:
        return 0
    
    return (sum_to_n(n-1) + n)



print(sum_to_n(5))