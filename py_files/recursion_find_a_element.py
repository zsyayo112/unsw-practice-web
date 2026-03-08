def find_element(arr, target, index=0):
    # 你来完成！
    # find_element([1, 3, 5, 3, 7], 3) 应该返回 1
    # find_element([1, 2, 4], 5) 应该返回 -1
    if len(arr) == 0:
        return -1
    if index >= len(arr):
        return -1
    
    if arr[index] == target:
        return index
    
    return find_element(arr,target,index+1)

# 测试
print(find_element([1, 3, 5, 3, 7], 3))  # 期望输出: 1
print(find_element([1, 2, 4], 5))        # 期望输出: -1 