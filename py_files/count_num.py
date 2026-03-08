def count_number(L,count):
    if len(L) == 0:
        return count
    
    if int(L[0]) > 0:
        # print(int(L[0]))
        count += 1
        # print(count)

        return count_number(L[1:],count)
    
    # return count

count = 0
count = count_number("1234",count)
print(count)
# print(count_number("1234",count))
# print(count)